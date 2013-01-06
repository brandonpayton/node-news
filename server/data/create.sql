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

CREATE TABLE article (
    id uuid NOT NULL,
    feed_id uuid NOT NULL,
    date date NOT NULL,
    link character varying(2048),
    author character varying(128),
    title text,
    summary text,
    description text,
    deleted boolean DEFAULT false NOT NULL
);


--
-- Name: feed; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE feed (
    id uuid NOT NULL,
    url character varying(2048) NOT NULL,
    name character varying(256) NOT NULL
);


--
-- Name: tag_to_feed; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE tag_to_feed (
    tag character varying(128) NOT NULL,
    feed_id uuid NOT NULL
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
    ADD CONSTRAINT feed_pkey PRIMARY KEY (id);


--
-- Name: feed_url_key; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY feed
    ADD CONSTRAINT feed_url_key UNIQUE (url);


--
-- Name: tag_to_feed_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY tag_to_feed
    ADD CONSTRAINT tag_to_feed_pkey PRIMARY KEY (tag, feed_id);


--
-- Name: article_feed_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY article
    ADD CONSTRAINT article_feed_id_fkey FOREIGN KEY (feed_id) REFERENCES feed(id);


--
-- PostgreSQL database dump complete
--

