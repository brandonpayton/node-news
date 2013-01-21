define([
    "dojo/_base/declare",
    "dojo/_base/array",
    "dojo/Deferred",
    "dojo/when",
    "dojo/request",
    "dojo/_base/lang",
    "dojo/store/Observable",
    "dojo/store/util/QueryResults",
    // TODO: Why is the relative path rooted at client instead of client/app/store?
    "app/store/ArticleStore"
], function(declare, arrayUtils, Deferred, when, request, lang, Observable, QueryResults, ArticleStore) {

    var putHeaders = { 'Content-Type': 'application/json' };

    return declare([], {

        dataUrl: null,

        constructor: function(args) {
            declare.safeMixin(this, args);
        },

        add: function(feedData, options) {
            var feed = lang.mixin({ type: "feed" }, feedData);
            return request.post(this.dataUrl + "/feeds", {
                headers: putHeaders,
                data: JSON.stringify(feed)
            });
        },

        put: function(feed, options) {
            var url = this.dataUrl + "/feed/" + encodeURIComponent(feed.url);
            return request.put(url, {
                headers: putHeaders,
                data: JSON.stringify(feed)
            });
        },

        remove: function(id) {
            return request.del(this._getFeedUrl(id));
        },

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

        getIdentity: function(object) {
          return object.type === "tag" ? object.name : object.url;
        },

        mayHaveChildren: function(object) {
            return object.type === "tag";
        },

        getChildren: function(object) {
            if(object.type !== "tag") {
                throw new Error("Only a tag may have children.");
            }
            return this.query({tag: object.name });
        },

        _getFeedUrl: function(id) {
            return this.dataUrl + "/feed/" + encodeURIComponent(id)
        }
    });
});
