\set ON_ERROR_STOP on

BEGIN;

\i :base_path'/epic/epic.sql';

\set feed_data_file :base_path'/feedData.csv'
\set tag_data_file :base_path'/tagData.csv'
\set article_data_file :base_path'/articleData.csv'

COPY news.feed (url, name) FROM :'feed_data_file' WITH csv;
COPY news.tag_to_feed (tag, feed_url) FROM :'tag_data_file' WITH csv;
COPY news.article (feed_url, guid, date, link, author, title, summary, description) FROM :'article_data_file' WITH csv;

/*
 * VIEW tests
 */ 
CREATE FUNCTION test.test_feed_tags() RETURNS VOID
LANGUAGE plpgsql
AS $$
-- module: views
BEGIN
    PERFORM test.assert_equal(
        (SELECT tags FROM news.feed_tags WHERE feed_url = 'http://www.modernperlbooks.com/mt/atom.xml'),
        ARRAY[ 'language', 'perl' ]::text[]
    );
    PERFORM test.pass();
END;
$$;

CREATE FUNCTION test.test_typed_feed() RETURNS VOID
LANGUAGE plpgsql
AS $$
-- module: views
BEGIN
    PERFORM test.assert(
        (SELECT EVERY(type = 'feed') FROM news.typed_feed),
        'Expected only type ''feed'''
    );
    PERFORM test.pass();
END;
$$;

-- TODO: Once content is moved into its own table, verify that typed_article contains no content column.
CREATE FUNCTION test.test_typed_article() RETURNS VOID
LANGUAGE plpgsql
AS $$
-- module: views
BEGIN
    PERFORM test.assert_not_empty('SELECT * FROM news.typed_article');
    PERFORM test.assert(
        (SELECT EVERY(type = 'article') FROM news.typed_article),
        'Expected only type ''article'''
    );
    PERFORM test.pass();
END;
$$;

CREATE FUNCTION test.test_tags_and_tagless_feeds() RETURNS VOID
LANGUAGE plpgsql
AS $$
-- module: views
BEGIN
    -- TODO: Test that tags come before feeds in the results.
    -- TODO: Test that tags and feeds groups are ordered by name
    -- For the time being, just test that the results contain both tags and feeds.
    PERFORM test.assert(
        (SELECT bool_or(type = 'tag') FROM news.tags_and_tagless_feeds),
        'Expected results to contain some of type ''tag'''
    );
    PERFORM test.assert(
        (SELECT bool_or(type = 'feed') FROM news.tags_and_tagless_feeds),
        'Expected results to contain some of type ''tag'''
    );

    -- Test row content
    PERFORM test.assert_values(
        'news.tags_and_tagless_feeds WHERE type=''tag''',
        '(SELECT ''tag''::text AS type, tag AS name FROM news.tag_to_feed GROUP BY tag ORDER BY tag) AS temp',
        'type, name'
    );
    PERFORM test.assert_rows(
        'SELECT * FROM news.tags_and_tagless_feeds WHERE type=''feed''',
        'SELECT * FROM news.typed_feed WHERE url NOT IN (SELECT feed_url FROM news.tag_to_feed)'
    );

    PERFORM test.pass();
END;
$$;

/*
 * FUNCTION tests
 */

CREATE FUNCTION test.test_get_feed() RETURNS VOID
LANGUAGE plpgsql
AS $$
-- module: functions
BEGIN
    PERFORM test.assert_rows(
        'SELECT * FROM news.get_feed(''https://blog.mozilla.org/feed/'')',
        'SELECT * FROM news.typed_feed WHERE url=''https://blog.mozilla.org/feed/'''
    );
    PERFORM test.pass();
END;
$$;

CREATE FUNCTION test.test_get_feeds_with_tag() RETURNS VOID
LANGUAGE plpgsql
AS $$
-- module: functions
BEGIN
    PERFORM test.assert_equal(
        (SELECT array_agg(name) FROM news.get_feeds_with_tag('language')),
        -- Verifying the in-order presence of expected feeds.
        ARRAY[
            'JavaScript',
            'Modern Perl Books for modern Perl programming'
        ]::text[]
    );
    PERFORM test.pass();
END;
$$;

CREATE FUNCTION test.test_get_feeds_and_tagless_feeds() RETURNS VOID
LANGUAGE plpgsql
AS $$
-- module: functions
BEGIN
    -- Just verify this function is querying the correct view.
    PERFORM test.assert_rows(
        'SELECT * FROM news.get_tags_and_tagless_feeds()',
        'SELECT * FROM news.tags_and_tagless_feeds'
    );
    PERFORM test.pass();
END;
$$;

CREATE FUNCTION test.test_save_feed() RETURNS VOID
LANGUAGE plpgsql
AS $$
-- module: functions
DECLARE
    expected_url text := 'http://blogs.msdn.com/b/ie/rss.aspx';
    expected_name text := 'IEBlog';
    expected_tags text[] := ARRAY[ 'ie', 'ms' ]::text[];
    new_feed_id text;
    actual_feed RECORD;
BEGIN

    SELECT INTO new_feed_id news.save_feed(
        url := expected_url, name := expected_name, tags := expected_tags
    );
    PERFORM assert_equal(new_feed_id, expected_url);
    SELECT * INTO actual_feed FROM news.get_feed(url := new_feed_id);
    PERFORM assert_equal(expected_url, actual_feed.url);
    PERFORM assert_equal(expected_name, actual_feed.name);
    PERFORM assert_equal(expected_tags, actual_feed.tags);
    PERFORM assert(NOT actual_feed.deleted, 'New feed must not have deleted flag set.');

    PERFORM test.pass();
END;
$$;

CREATE FUNCTION test.test_soft_delete_feed() RETURNS VOID
LANGUAGE plpgsql
AS $$
-- module: functions
DECLARE
    test_url text := 'http://drmcninja.com/feed/';
    feed news.typed_feed%ROWTYPE;
BEGIN
    SELECT * INTO feed FROM news.typed_feed WHERE url = test_url;
    PERFORM assert(NOT feed.deleted, 'Feed was deleted prior to the test.');
    PERFORM news.soft_delete_feed(url := feed.url);
    SELECT * INTO feed FROM news.typed_feed WHERE url = test_url;
    PERFORM assert(feed.deleted, 'Feed was not deleted.');
    
    PERFORM test.pass();
END;
$$;

CREATE FUNCTION test.test_get_article() RETURNS VOID
LANGUAGE plpgsql
AS $$
-- module: functions
DECLARE
    expected_article news.typed_article%ROWTYPE;
    actual_article news.typed_article%ROWTYPE;
BEGIN
    SELECT * INTO expected_article FROM news.typed_article WHERE id = 1;
    PERFORM test.assert(expected_article IS NOT NULL, 'expected_article is NULL');
    SELECT * INTO actual_article FROM news.get_article(id := expected_article.id);
    PERFORM test.assert_equal(actual_article, expected_article);

    PERFORM test.pass();
END;
$$;

CREATE FUNCTION test.test_get_articles_for_feed() RETURNS VOID
LANGUAGE plpgsql
AS $$
-- module: functions
DECLARE
    example_feed_url text := 'https://blog.mozilla.org/javascript/feed/';
BEGIN
    CREATE TABLE test.expected_articles (LIKE news.typed_article);
    CREATE TABLE test.actual_articles (LIKE news.typed_article);

    INSERT INTO expected_articles
        SELECT * FROM news.typed_article WHERE feed_url = example_feed_url ORDER BY date;
    INSERT INTO actual_articles
        SELECT * FROM news.get_articles_for_feed(feed_url := example_feed_url);

    PERFORM test.assert_rows(
        'SELECT * FROM test.actual_articles',
        'SELECT * FROM test.expected_articles'
    );

    PERFORM test.pass();
END;
$$;

CREATE FUNCTION test.test_get_articles_for_tag() RETURNS VOID
LANGUAGE plpgsql
AS $$
-- module: functions
DECLARE
    example_tag text := 'language';
BEGIN
    CREATE TABLE test.expected_articles (LIKE news.typed_article);
    CREATE TABLE test.actual_articles (LIKE news.typed_article);

    INSERT INTO expected_articles
        SELECT * FROM news.typed_article WHERE feed_url
            IN (SELECT feed_url FROM news.tag_to_feed WHERE tag = example_tag)
            ORDER BY date;
    INSERT INTO actual_articles
        SELECT * FROM news.get_articles_for_tag(tag := example_tag);

    PERFORM test.assert_rows(
        'SELECT * FROM test.actual_articles',
        'SELECT * FROM test.expected_articles'
    );

    PERFORM test.pass();
END;
$$;

CREATE FUNCTION test.test_save_article() RETURNS VOID
LANGUAGE plpgsql
AS $$
-- module: functions
DECLARE
    expected_feed_url text := 'https://blog.mozilla.org/javascript/feed/';
    expected_guid text := 'never seen before';
    expected_date timestamp := '2013-01-10T05:19:49.000Z';
    expected_link text := 'http://test.link';
    expected_author text := 'Thor, A.U.';
    expected_title text := 'A Message from the Future';
    expected_summary text := 'The pronunciation of "JavaScript" has been changed.';
    expected_description text := 
        'The first ''a'' in JavaScript must now be pronounced as those ' ||
        'found in the words track, yak, frak, sack, and whack. '
        'Thank you. That is all. ' ||
        'Sincerely, The Future';
    new_article_id integer;
    actual_article RECORD;
    updated_title text := 'An IMPORTANT Message from the Future';
    updated_article_id integer;
    actual_updated_article RECORD;
BEGIN
    SELECT INTO new_article_id news.save_article(
        feed_url := expected_feed_url,
        guid := expected_guid,
        date := expected_date,
        link := expected_link,
        author := expected_author,
        title := expected_title,
        summary := expected_summary,
        description := expected_description
    );
    SELECT * INTO actual_article FROM news.get_article(id := new_article_id);
    PERFORM test.assert_equal(actual_article.feed_url, expected_feed_url);
    PERFORM test.assert_equal(actual_article.guid, expected_guid);
    PERFORM test.assert_equal(actual_article.date, expected_date);
    PERFORM test.assert_equal(actual_article.link, expected_link);
    PERFORM test.assert_equal(actual_article.author, expected_author);
    PERFORM test.assert_equal(actual_article.title, expected_title);
    PERFORM test.assert_equal(actual_article.summary, expected_summary);
    PERFORM test.assert_equal(actual_article.description, expected_description);

    SELECT INTO updated_article_id news.save_article(
        id := actual_article.id,
        feed_url := actual_article.feed_url,
        guid := actual_article.guid,
        date := actual_article.date,
        link := actual_article.link,
        author := actual_article.author,
        title := updated_title,
        summary := actual_article.summary,
        description := actual_article.description
    );
    PERFORM test.assert_equal(new_article_id, updated_article_id);
    SELECT * INTO actual_updated_article FROM news.get_article(id := updated_article_id);
    SELECT updated_title INTO actual_article.title;

    PERFORM test.pass();
END;
$$;

SELECT * FROM test.run_all();

ROLLBACK;
