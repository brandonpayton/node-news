define([
    "dojo/_base/lang",
    "dojo/_base/declare",
    "dojo/request",
    "dojo/store/util/QueryResults"
    /*=====, "dojo/store/api/Store" =====*/
], function(lang, declare, request, QueryResults /*=====, Store =====*/) {

    // No base class, but for purposes of documentation, the base class is dojo/store/api/Store
    var base = null;
    /*===== base = Store =====*/

    // TODO: This was taken as an example from the gfx Point documentation which included an assignment to g.Point. Does this declare need assigned to something?
    /*=====
    declare("client/store/Feed", null, {
		// summary:
		//		An RSS/Atom feed.
		// description:
		//		There is no constructor for a Feed. This is where the form of a Feed is documented.

        // url: String
        //      The URL of the feed
        url: null,

        // name: String
        //      The name of the feed.
        name: null,

        // tags: Array
        //      An array of tags
        tags: null
    });
    =====*/

    // putHeaders:
    //      Collection of common HTTP headers to use when doing PUTs and POSTs.
    var putHeaders = { 'Content-Type': 'application/json' };

    return declare(base, {
        // summary:
        //      A store for RSS/Atom feeds

        // dataUrl: String
        //      The root URL of the news aggregator API.
        dataUrl: null,

        constructor: function(args) {
            // summary:
            //      Create the store.
            // args: Object
            //      Object hash containing a dataUrl property.
            declare.safeMixin(this, args);
        },

        add: function(feedData, options) {
            // summary:
            //      Adds a Feed to the store.
            // feedData: Object
            //      A Feed-like object containing a Feed's url and tags properties.
            // options: Object
            //      No options are currently supported.
            // returns: dojo/promise/Promise
            //      A promise to add the Feed.
            var feed = lang.mixin({ type: "feed" }, feedData);
            return request.post(this.dataUrl + "/feeds", {
                headers: putHeaders,
                data: JSON.stringify(feed)
            });
        },

        put: function(feed, options) {
            // summary:
            //      Stores a feed.
            // feed: Feed
            //      The Feed to store.
            // options: Object
            //      No options are currently supported.
            // returns: dojo/promise/Promise
            //      A promise to store the Feed.
            var url = this._getFeedApiUrl(this.getIdentity(feed));
            return request.put(url, {
                headers: putHeaders,
                data: JSON.stringify(feed)
            });
        },

        remove: function(id) {
            // summary:
            //      Removes a Feed from the store.
            // id: String
            //      The identity of the Feed to remove.
            // returns: dojo/promise/Promise
            //      A promise to remove the specified Feed.
            return request.del(this._getFeedApiUrl(id));
        },

        query: function(query, options) {
            // summary:
            //      Queries the store for Feeds and Tags
            // query: Object
            //      The query
            // options: Object
            //      No options are currently supported.
            query = query || {};
            if(query.tag !== undefined) {
                var url = this.dataUrl + "/tag/" + encodeURIComponent(query.tag) + "/feeds";
                return QueryResults(request(url, { handleAs: "json" }));
            } else {
                var url = this.dataUrl + "/feeds";
                return QueryResults(request(url, { handleAs: "json" }));
            }
        },

        getIdentity: function(object) {
            // summary:
            //      Returns the identity of the specified Feed or Tag
            // object: Feed or Tag
            //      The object to get the identity from
            // returns: String
            //      The identity
            return object.type === "tag" ? object.name : object.url;
        },

        mayHaveChildren: function(object) {
            // summary:
            //      Returns whether the specified object may have children.
            // object: Object
            //      The object that may or may not have children.
            // returns: Boolean
            //      A boolean indicating whether the specified object may have children.
            return object.type === "tag";
        },

        getChildren: function(object) {
            // summary:
            //      Returns the children of the specified object.
            // object: Object
            //      The object to get the children for
            // returns: Store.QueryResults
            //      The children of the specified object.
            if(object.type !== "tag") {
                throw new Error("Only a tag may have children.");
            }
            return this.query({tag: object.name });
        },

        _getFeedApiUrl: function(id) {
            // summary:
            //      Returns the API URL for the feed with the specified id.
            // id: String
            //      The Feed identity
            // returns: String
            //      The API URL for the Feed resource 
            return this.dataUrl + "/feed/" + encodeURIComponent(id)
        }
    });
});
