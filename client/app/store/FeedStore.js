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

    return declare([], {
        dataUrl: "../data",
        idProperty: "_id",

        get: function() {
          throw new Error("Ouch");
        },

        add: function(feedData, options) {
            var feed = lang.mixin({ type: "feed" }, feedData);
            return request.post(this.dataUrl + "/feeds", {
                handleAs: "json",
                data: JSON.stringify(feed)
            });
        },

        put: function(feedData, options) {
            var feed = lang.mixin({ type: "feed" }, feedData);
                // TODO: URL Encode or does dojo/request do that? (Probably not)
                url = this.dataUrl + "/feeds/" + object._id;
            return request.put(url, {
                data: JSON.stringify(object)
            });
        },

        remove: function(id) {
            return request.delete(this.dataUrl + "/feeds/" + id);
        },

        query: function(query, options) {
            return QueryResults(request(this.dataUrl + "/feeds", {
                handleAs: "json"
            }));
        },

        getIdentity: function(object) {
          return object[this.idProperty];
        },

        getChildren: function(object) {
            return this.query();
        },

        getArticleStore: function(feedId) {
            return Observable(new ArticleStore(this.dataUrl + "/feed/" + encodeURIComponent(feedId)));
        }
    });
});
