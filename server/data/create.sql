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

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: article; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TYPE news_object_type AS ENUM('feed', 'tag');
CREATE TYPE feed_or_tag AS (
    type news_object_type,
    name varchar(256),
    url varchar(2048),
    tags varchar(128) ARRAY
);

CREATE TABLE article (
    -- NOTE: There doesn't appear to be any real length limit on RSS/atom article GUIDs. 
    id char(256) NOT NULL,
    feed_url varchar(2048) NOT NULL,
    date date NOT NULL,
    link varchar(2048),
    author varchar(128),
    title text,
    summary text,
    description text,
    deleted boolean DEFAULT false NOT NULL
);

--
-- Name: feed; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE feed (
    name varchar(256) NOT NULL,
    url varchar(2048)
);


--
-- Name: tag_to_feed; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE tag_to_feed (
    tag varchar(128) NOT NULL,
    feed_url varchar(2048) NOT NULL
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

CREATE FUNCTION get_feed(url varchar(2048))
RETURNS feed
$$
    SELECT * FROM feed WHERE url = $1;
$$
LANGUAGE SQL;

CREATE FUNCTION get_tags_and_tagless_feeds()
RETURNS feed_or_tag
AS
$$
    SELECT 'tag' AS type, tag AS name, NULL AS url, NULL AS tags FROM tag_to_feed GROUP BY tag;
    UNION
    SELECT 'feed' AS type, name, url, ARRAY[]::varchar(128)[] AS tags
        FROM feed
        WHERE url NOT IN (SELECT feed_url FROM tag_to_feed) AND NOT deleted
        ORDER BY name;
$$
LANGUAGE SQL;

CREATE FUNCTION get_feeds_with_tag(tag varchar(128))
RETURNS feed_or_tag
AS
$$
    SELECT 'feed' AS type, name AS name, url AS url, ARRAY[]::varchar(128)[] AS tags
        FROM feed
        WHERE url in (SELECT feed_url FROM tag_to_feed WHERE tag = $1) AND NOT deleted
        ORDER BY name;
$$
LANGUAGE SQL;

CREATE FUNCTION save_feed(
    url varchar(2048),
    name varchar(256),
    tags varchar(128)[]
)
RETURNS void
AS
$$
    IF EXISTS(SELECT 1 FROM feed WHERE url = $1) THEN
        UPDATE feed SET name = $2 WHERE url = $1;
    ELSE
        INSERT INTO feed (url, name) VALUES ($1, $2);
    END IF
$$
LANGUAGE SQL;

CREATE FUNCTION soft_delete_feed(url varchar(2048))
RETURNS void
AS
$$
    UPDATE feed SET deleted = TRUE WHERE url = $1;
$$
LANGUAGE SQL;

-- save_article

--
-- PostgreSQL database dump complete
--

