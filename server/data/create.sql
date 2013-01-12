--
-- PostgreSQL database dump
--

SET statement_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

--
-- Name: ${database_name}; Type: DATABASE; Schema: -; Owner: -
--

CREATE DATABASE ${database_name} WITH TEMPLATE = template0 ENCODING = 'UTF8' LC_COLLATE = 'en_US' LC_CTYPE = 'en_US';


\connect ${database_name}

SET statement_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

--
-- Name: news_object_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE news_object_type AS ENUM (
    'feed',
    'tag',
    'article'
);


--
-- Name: feed_or_tag; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE feed_or_tag AS (
	type news_object_type,
	name character varying(256),
	url character varying(2048),
	tags character varying(128)[]
);

CREATE TYPE typed_feed AS (
	type news_object_type,
	name character varying(256),
	url character varying(2048),
    deleted boolean,
	tags character varying(128)[]
);

CREATE TYPE typed_article AS (
    type news_object_type,
    id integer,
    feed_url character varying(2048),
    guid character(256),
    date date,
    link character varying(2048),
    author character varying(128),
    title text,
    summary text,
    description text,
    deleted boolean
);

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: feed; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE feed (
    name character varying(256) NOT NULL,
    url character varying(2048) NOT NULL,
    deleted boolean DEFAULT FALSE
);


--
-- Name: get_feed(character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION get_feed(url character varying(2048))
RETURNS typed_feed
    LANGUAGE sql
    AS $_$
    SELECT 'feed'::news_object_type, feed.name, feed.url, feed.deleted, get_feed_tags($1) FROM feed WHERE feed.url = $1;
$_$;

CREATE FUNCTION get_feed_tags(url varchar(2048)) RETURNS varchar(128)[]
    LANGUAGE sql
    AS $_$
    SELECT array_agg(tag) FROM tag_to_feed WHERE feed_url = $1;
$_$;

--
-- Name: get_feeds_with_tag(character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION get_feeds_with_tag(tag character varying) RETURNS SETOF feed_or_tag
    LANGUAGE sql
    AS $_$
    SELECT 'feed'::news_object_type AS type, feed.name AS name, feed.url AS url, get_feed_tags(url := url) AS tags
        FROM feed
        WHERE url in (SELECT feed_url FROM tag_to_feed WHERE tag = $1) AND NOT deleted
        ORDER BY name;
$_$;


--
-- Name: get_tags_and_tagless_feeds(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION get_tags_and_tagless_feeds() RETURNS SETOF feed_or_tag
    LANGUAGE sql
    AS $$
    SELECT 'tag'::news_object_type AS type, tag AS name, NULL AS url, NULL AS tags FROM tag_to_feed GROUP BY tag
    UNION ALL
    SELECT 'feed'::news_object_type AS type, name, url, get_feed_tags(url := url) AS tags
        FROM feed
        WHERE url NOT IN (SELECT feed_url FROM tag_to_feed) AND NOT deleted
    ORDER BY type DESC, name;
$$;


--
-- Name: save_feed(character varying, character varying, character varying[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION save_feed(url character varying, name character varying, tags character varying[]) RETURNS void
    LANGUAGE plpgsql
    AS $_$
    BEGIN
        IF EXISTS(SELECT 1 FROM feed WHERE feed.url = $1) THEN
            UPDATE feed SET name = $2 WHERE feed.url = $1;
        ELSE
            INSERT INTO feed (url, name) VALUES ($1, $2);
        END IF;

        -- TODO: Only call unnest once and assign to var. ... not doing it now because I don't know how to do that w/ postgres.
        -- Removing all and readding tags for simplicity.
        DELETE FROM tag_to_feed WHERE url = $1;
        INSERT INTO tag_to_feed (tag, feed_url)
            SELECT *, $1 FROM (SELECT unnest($3)) AS tags;
    END;
$_$;


--
-- Name: soft_delete_feed(character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION soft_delete_feed(url character varying) RETURNS void
    LANGUAGE sql
    AS $_$
    UPDATE feed SET deleted = TRUE WHERE url = $1;
$_$;


CREATE FUNCTION get_article(id char) RETURNS typed_article
    LANGUAGE sql
    AS $_$
    SELECT 'article'::news_object_type, * FROM article WHERE id = $1;
$_$;

CREATE FUNCTION soft_delete_article(id char) RETURNS void
    LANGUAGE sql
    AS $_$
    UPDATE article SET deleted = TRUE WHERE id = $1;
$_$;

CREATE FUNCTION get_articles_for_feed(feed_url varchar) RETURNS SETOF typed_article
    LANGUAGE sql
    AS $_$
    SELECT 'article'::news_object_type, * FROM article
        WHERE feed_url = $1
        ORDER BY date;
$_$;

CREATE FUNCTION get_articles_for_tag(feed_url varchar) RETURNS SETOF typed_article
    LANGUAGE sql
    AS $_$
    SELECT 'article'::news_object_type, * FROM article 
        WHERE feed_url in (SELECT feed_url FROM tag_to_feed WHERE tag = $1)
        ORDER BY date;
$_$;

CREATE FUNCTION save_article(
    id integer,
    feed_url varchar,
    guid char,
    date date,
    link char,
    author varchar,
    title text,
    summary text,
    description text,
    deleted boolean DEFAULT NULL
) RETURNS void
    LANGUAGE plpgsql
    AS $_$
    
    IF EXISTS(SELECT 1 FROM article WHERE article.id = id) THEN
        UPDATE article SET
            article.feed_url = feed_url,
            article.guid = guid,
            article.date = date,
            article.link = link,
            article.author = author,
            article.title = title,
            article.summary = summary,
            article.description = description,
            article.deleted = deleted
                WHERE article.id = id
    ELSE
        INSERT INTO article (feed_url, guid, date, link, author, title, summary, description, deleted)
            VALUES (feed_url, guid, date, link, author, title, summary, description, deleted);
    END;
$_$;

--
-- Name: article; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE article (
    id SERIAL,
    feed_url character varying(2048) NOT NULL,
    guid character(256),
    date date NOT NULL,
    link character varying(2048),
    author character varying(128),
    title text,
    summary text,
    description text,
    deleted boolean DEFAULT false NOT NULL
);


--
-- Name: tag_to_feed; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE tag_to_feed (
    tag character varying(128) NOT NULL,
    feed_url character varying(2048) NOT NULL
);


--
-- Name: article_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY article
    ADD CONSTRAINT article_pkey PRIMARY KEY (id);


--
-- Name: feed_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY feed
    ADD CONSTRAINT feed_pkey PRIMARY KEY (url);


--
-- Name: tag_to_feed_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY tag_to_feed
    ADD CONSTRAINT tag_to_feed_pkey PRIMARY KEY (tag, feed_url);


--
-- Name: article_feed_url_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY article
    ADD CONSTRAINT article_feed_url_fkey FOREIGN KEY (feed_url) REFERENCES feed(url);


--
-- PostgreSQL database dump complete
--

