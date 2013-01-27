define([
    "dojo/_base/lang",
    "dojo/_base/declare",
    "dojo/request",
    "dojo/store/util/QueryResults"
], function(lang, declare, request, QueryResults) {

    /**
     * Collection of common HTTP headers to use when doing PUTs and POSTs.
     * @type {object}
     */
    var putHeaders = { 'Content-Type': 'application/json' };

    /**
     * A data store for feed objects.
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
         * Performs the duties of a constructor.
         * @param args {{dataUrl: string}} 
         */
        constructor: function(args) {
            declare.safeMixin(this, args);
        },

        /**
         * Adds a feed to the store.
         * @param {object} feedData The feed data to add.
         * @param {object} options Ignored.
         * @return {Promise} A promise to add the feed.
         */
        add: function(feedData, options) {
            var feed = lang.mixin({ type: "feed" }, feedData);
            return request.post(this.dataUrl + "/feeds", {
                headers: putHeaders,
                data: JSON.stringify(feed)
            });
        },

        /**
         * Updates a feed in the store.
         * @param {object} feedData The feed data to add.
         * @param {object} options Ignored.
         * @return {Promise} A promise to add the feed.
         */
        put: function(feed, options) {
            var url = this._getFeedUrl(this.getIdentity(feed));
            return request.put(url, {
                headers: putHeaders,
                data: JSON.stringify(feed)
            });
        },

        /**
         * Removes a feed from the store.
         * @param {string} id The id of the feed to remove.
         * @return {Promise} A promise to remove the feed.
         */
        remove: function(id) {
            return request.del(this._getFeedUrl(id));
        },

        /**
         * Queries the store for feeds and feed tags.
         * @param {object} query The query object.
         * @param {object} options Ignored.
         * @return {Store.QueryResult} The query results.
         */
        query: function(query, options) {
            query = query || {};
            if(query.tag !== undefined) {
                var url = this.dataUrl + "/tag/" + encodeURIComponent(query.tag) + "/feeds";
                return QueryResults(request(url, { handleAs: "json" }));
            } else {
                var url = this.dataUrl + "/feeds";
                return QueryResults(request(url, { handleAs: "json" }));
            }
        },

        /** @inheritDoc */
        getIdentity: function(object) {
          return object.type === "tag" ? object.name : object.url;
        },

        /** @inheritDoc */
        mayHaveChildren: function(object) {
            return object.type === "tag";
        },

        /** @inheritDoc */
        getChildren: function(object) {
            if(object.type !== "tag") {
                throw new Error("Only a tag may have children.");
            }
            return this.query({tag: object.name });
        },

        /**
         * Returns the URL for the feed with the specified id.
         * @param {string} id The id of the feed resource.
         * @return {string} The URL for this feed resource.
         */
        _getFeedUrl: function(id) {
            return this.dataUrl + "/feed/" + encodeURIComponent(id)
        }
    });
});
