define([
    "dojo/_base/declare",
    "dojo/request",
    "dojo/store/util/QueryResults"
], function(declare, request, QueryResults) {

    /**
     * Converts article data to a proper article object.
     * @param {object} articleData Raw article data object.
     * @returns {object} The updated article object.
     */
    function convertDataToArticle(articleData) {
        articleData.date = new Date(articleData.date);
        return articleData;
    }

    /**
     * @constructor
     * @implements {Store}
     */
    return declare(null, {
        /**
         * The root URL of the news aggregator API.
         * @type {string}
         */
        dataUrl: null,

        /**
         * Performs the duties of a constructor
         * @args {{dataUrl: string}}
         */
        constructor: function(args) {
            declare.safeMixin(this, args);
        },

        /** @inheritDoc */
        getIdentity: function(article) {
            return article.id;
        },

        /**
         * Gets an article by id.
         * @param {string} id The id of the desired article.
         * @return {Promise} A promise to provide the article.
         */
        // TODO: Look for a convention for documenting returned promises. I don't want to lose the fact that this is a promise or the type of the resolved value.
        // TODO: Migrate articles to use composite Primary Key (feedUrl+guid). Currently, this store is broken.
        get: function(id) {
            return request(this._getArticleUrl(id), {
                handleAs: "json"
            }).then(convertDataToArticle);
        },

        /**
         * Update an article.
         * @param {object} article The article object to save.
         * @param {object} options Ignored.
         * @return {Promise} A promise to save the article.
         */
        put: function(article, options) {
            // TODO: Restore this line after migrating from int primary key to (feedUrl+guid)
            //var articleUrl = this._getArticleUrl(this.getIdentity(article));
            var articleUrl = this.dataUrl +
                "/feed/" + encodeURIComponent(article.feedUrl) +
                "/article/" + encodeURIComponent(this.getIdentity(article));

            return request.put(articleUrl, {
                headers: {
                    // DOJO TODO: File bug about case-sensitive Content-Type header. If the casing isn't like this, then the default content type overrides ours.
                    "Content-Type": "application/json"
                },
                data: JSON.stringify(article),
                handleAs: "json"
            });
        },

        /**
         * Query for articles.
         * @param {object} query The query object.
         * @param {object} options Currently ignored but may later be used to allow requesting ranges of articles.
         * @return {Store.QueryResults} The results of the query.
         */
        query: function(query, options) {
            var queryUrl = this.dataUrl;
            if(query.feedUrl !== undefined) {
                queryUrl += "/feed/" + encodeURIComponent(query.feedUrl) + "/articles";
            } else if(query.tag !== undefined) {
                queryUrl += "/tag/" + query.tag + "/articles";
            } else {
                throw new Error("Unsupported article query.");
            }
            
            var asyncResults = request(queryUrl, {
                handleAs: "json"
            }).then(function(results) {
                return results.map(convertDataToArticle);
            });
            return QueryResults(asyncResults);
        }
        // TODO: Resume using this after converting to feedUrl+guid primary key.
        /*
        _getArticleUrl: function(feedUrl, guid) {
            return this.dataUrl +
                "/feed/" + encodeURIComponent(article.feedUrl) +
                "/article/" + encodeURIComponent(guid);
        }
        */
    });
});
