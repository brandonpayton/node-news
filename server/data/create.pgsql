\set ON_ERROR_STOP on

SET check_function_bodies = true;

DROP DATABASE IF EXISTS :database_name;
CREATE DATABASE :database_name WITH TEMPLATE = template0 ENCODING = 'UTF8' LC_COLLATE = 'en_US' LC_CTYPE = 'en_US';


\connect :database_name

SET statement_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = true;
SET client_min_messages = warning;


CREATE SCHEMA news;

/*
 * TABLEs
 */
CREATE TABLE news.feed (
    name text NOT NULL,
    url text NOT NULL,
    deleted boolean DEFAULT FALSE
);

CREATE TABLE news.tag_to_feed (
    tag text NOT NULL,
    feed_url text NOT NULL
);

CREATE TABLE news.article (
    feed_url text NOT NULL,
    guid text,
    date timestamp NOT NULL,
    link text,
    author text,
    title text,
    summary text,
    description text,
    read boolean DEFAULT false
);

/*
 * CONSTRAINTs
 */
ALTER TABLE ONLY news.feed
    ADD CONSTRAINT feed_pkey PRIMARY KEY (url);

ALTER TABLE ONLY news.tag_to_feed
    ADD CONSTRAINT tag_to_feed_pkey PRIMARY KEY (tag, feed_url);

ALTER TABLE ONLY news.tag_to_feed
    ADD CONSTRAINT tag_to_feed_feed_url_fkey FOREIGN KEY (feed_url) REFERENCES news.feed(url);

ALTER TABLE ONLY news.article
    ADD CONSTRAINT article_pkey PRIMARY KEY (feed_url, guid);

ALTER TABLE ONLY news.article
    ADD CONSTRAINT article_feed_url_fkey FOREIGN KEY (feed_url) REFERENCES news.feed(url);

/*
 * VIEWs
 */

CREATE VIEW news.feed_tags AS
    SELECT feed_url, array_agg(tag ORDER BY tag) AS tags FROM news.tag_to_feed GROUP BY feed_url;

CREATE VIEW news.typed_feed AS
    SELECT 'feed'::text AS type, news.feed.*, news.feed_tags.tags
        FROM news.feed LEFT OUTER JOIN news.feed_tags ON news.feed.url = news.feed_tags.feed_url;

CREATE VIEW news.typed_article AS
    SELECT 'article'::text AS type, * FROM news.article ORDER BY date DESC;

-- TODO: Test that only tags on non-deleted feeds are included.
CREATE OR REPLACE VIEW news.tags_and_tagless_feeds AS
	-- SELECTING this way so functions can be used in the ORDER BY clause and we can sort case-insensitively
	SELECT * FROM (
		SELECT 'tag' AS type, tag AS name, NULL AS url, NULL AS deleted, NULL AS tags FROM news.tag_to_feed
			WHERE feed_url IN (SELECT url FROM news.feed WHERE NOT deleted)
			GROUP BY tag
		UNION ALL
		SELECT * FROM news.typed_feed
			WHERE url NOT IN (SELECT feed_url FROM news.tag_to_feed) AND NOT deleted
	) AS temp
	-- TODO: Sorting by 'type' is hack based on coincidence. If we had three types of things that we wanted sorted a certain way, alphabetical sorting wouldn't be a foolproof solution. What is a clean, explicit way to make tags come first in the results?
	-- case-insensitive order 
	ORDER BY type DESC, lower(name);

/*
 * FUNCTIONs
 */

CREATE FUNCTION news.get_feed(url text) RETURNS news.typed_feed
LANGUAGE sql
AS $$
    SELECT * FROM news.typed_feed WHERE url = $1;
$$;

CREATE FUNCTION news.get_feeds_with_tag(tag text) RETURNS SETOF news.typed_feed
LANGUAGE sql
AS $$
    SELECT * FROM news.typed_feed
        WHERE url IN (SELECT feed_url FROM news.tag_to_feed WHERE tag = $1) AND NOT deleted
		-- case-insensitive order
        ORDER BY lower(name);
$$;

CREATE FUNCTION news.get_tags_and_tagless_feeds() RETURNS SETOF news.tags_and_tagless_feeds
LANGUAGE sql
AS $$
    SELECT * FROM news.tags_and_tagless_feeds;
$$;

CREATE FUNCTION news.save_feed(url text, name text, tags text[]) RETURNS SETOF news.feed.url%TYPE
LANGUAGE plpgsql
AS $$
    BEGIN
        IF EXISTS(SELECT 1 FROM news.feed WHERE feed.url = save_feed.url) THEN
            RETURN QUERY
            UPDATE news.feed SET name = $2, deleted=false WHERE feed.url = save_feed.url 
                RETURNING news.feed.url;
        ELSE
            RETURN QUERY
            INSERT INTO news.feed (url, name) VALUES ($1, $2)
                RETURNING news.feed.url;
        END IF;

        -- Removing all and readding tags for simplicity.
        DELETE FROM news.tag_to_feed WHERE feed_url = url;
        INSERT INTO news.tag_to_feed (tag, feed_url)
            SELECT *, url FROM (SELECT unnest(tags)) AS tags;
    END;
$$;

CREATE FUNCTION news.soft_delete_feed(url text) RETURNS void
LANGUAGE sql
AS $$
    UPDATE news.feed SET deleted = TRUE WHERE url = $1;
$$;


CREATE FUNCTION news.get_article(feed_url text, guid text) RETURNS news.typed_article
LANGUAGE sql
AS $$
    SELECT * FROM news.typed_article WHERE feed_url = $1 AND guid = $2;
$$;

CREATE FUNCTION news.get_articles_for_feed(feed_url text) RETURNS SETOF news.typed_article
LANGUAGE sql
AS $$
    SELECT * FROM news.typed_article WHERE feed_url = $1;
$$;

CREATE FUNCTION news.get_articles_for_tag(tag text) RETURNS SETOF news.typed_article
LANGUAGE sql
AS $$
    SELECT * FROM news.typed_article 
        WHERE feed_url in (SELECT feed_url FROM news.tag_to_feed WHERE tag = $1);
$$;

CREATE FUNCTION news.save_article(
    feed_url text,
    guid text,
    date timestamp,
    link text,
    author text,
    title text,
    summary text,
    description text,
    read boolean DEFAULT false
) RETURNS void
LANGUAGE plpgsql
AS $$
    BEGIN
        IF EXISTS(
            SELECT 1 FROM news.article
            WHERE article.feed_url = save_article.feed_url AND article.guid = save_article.guid
        ) THEN
            UPDATE news.article SET
                feed_url = save_article.feed_url,
                guid = save_article.guid,
                date = save_article.date,
                link = save_article.link,
                author = save_article.author,
                title = save_article.title,
                summary = save_article.summary,
                description = save_article.description,
                read = save_article.read
                    WHERE article.feed_url = save_article.feed_url AND article.guid = save_article.guid;
        ELSE
            INSERT INTO news.article
                (feed_url, guid, date, link, author, title, summary, description) VALUES
                (feed_url, guid, date, link, author, title, summary, description);
        END IF;
    END;
$$;
