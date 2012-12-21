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
        dataUrl: "../data",

        get: function() {
          throw new Error("Ouch");
        },

        add: function(feedData, options) {
            var feed = lang.mixin({ type: "feed" }, feedData);
            return request.post(this.dataUrl + "/feeds", {
                headers: putHeaders,
                data: JSON.stringify(feed),
                handleAs: "json"
            });
        },

        put: function(feedData, options) {
            var feed = lang.mixin({ type: "feed" }, feedData);
                // TODO: URL Encode or does dojo/request do that? (Probably not)
                url = this.dataUrl + "/feeds/" + object._id;
            return request.put(url, {
                headers: putHeaders,
                data: JSON.stringify(object)
            });
        },

        remove: function(id) {
            return request.del(this._getFeedUrl(id));
        },

        query: function(query, options) {
            query = query || {};
            if(query.tag !== undefined) {
                return QueryResults(request(this.dataUrl + "/tag/" + encodeURIComponent(query.tag), {
                    handleAs: "json"
                }));
            } else {
                return QueryResults(request(this.dataUrl + "/feeds", {
                    handleAs: "json"
                }));
            }
        },

        getIdentity: function(object) {
          return object.type === "tag" ? object.name : object._id;
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

        getArticleStore: function(feedId) {
            return Observable(new ArticleStore(this.dataUrl + "/feed/" + encodeURIComponent(feedId)));
        },

        _getFeedUrl: function(id) {
            return this.dataUrl + "/feed/" + encodeURIComponent(id)
        }
    });
});
