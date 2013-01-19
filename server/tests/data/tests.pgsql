\set ON_ERROR_STOP on

BEGIN;

\i '${base_path}/epic/epic.sql';

COPY news.feed (url, name) FROM '${base_path}/feedData.csv' WITH csv;
COPY news.tag_to_feed (tag, feed_url) FROM '${base_path}/tagData.csv' WITH csv;
COPY news.article (feed_url, guid, date, link, author, title, summary, description) FROM '${base_path}/articleData.csv' WITH csv;

CREATE FUNCTION test.test_get_feeds_and_tagless_feeds() RETURNS VOID
LANGUAGE plpgsql
AS $$
-- module: news
BEGIN
    PERFORM test.assert_values(
        'news.get_tags_and_tagless_feeds() WHERE type=''tag''',
        '(SELECT ''tag''::text AS type, tag AS name FROM news.tag_to_feed GROUP BY tag ORDER BY tag) AS temp',
        'type, name'
    );
    PERFORM test.assert_rows(
        'SELECT * FROM news.get_tags_and_tagless_feeds() WHERE type=''feed''',
        'SELECT * FROM news.typed_feed WHERE url NOT IN (SELECT feed_url FROM news.tag_to_feed)'
    );
    -- TODO: Test that tags come before feeds in the results.
    -- TODO: Test that tags and feeds groups are ordered by name
    PERFORM test.pass();
END;
$$;

CREATE FUNCTION test.test_get_feed_tags() RETURNS VOID
LANGUAGE plpgsql
AS $$
-- module: news
BEGIN
    PERFORM test.assert_equal(
        news.get_feed_tags(url := 'http://www.modernperlbooks.com/mt/atom.xml'),
        ARRAY[ 'language', 'perl' ]::text[]
    );
    PERFORM test.pass();
END;
$$;

SELECT * FROM test.run_all();

ROLLBACK;
