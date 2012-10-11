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
    "app/store/model/Feed"
], function(declare, arrayUtils, Deferred, when, request, lang, Observable, QueryResults, Feed) {

    var ArticleStore = declare([], {
        feedUrl: null,

        idProperty: "_key",
        constructor: function(feedUrl) {
            this.feedUrl = feedUrl;
        },
        query: function(query, options) {
            var asyncRequest = request(this.feedUrl + "/articles", {
                handleAs: "json"
            });
            var asyncResults = when(asyncRequest, function(results) {
                results.forEach(function(article) {
                    article.date = new Date(article.date);
                });
                return results;
            });
            return QueryResults(asyncResults);
        },
        put: function(value, options) {

        },
        remove: function(articleId) {

        },

        getIdentity: function(object) {
            return object._key;
        }
    });

    return declare([], {
        dataUrl: "../data",
        idProperty: "_key",

        get: function() {
          throw new Error("Ouch");
        },

        add: function(object, options) {
            var async = new Deferred()
            var self = this;
            request.post(this.dataUrl + "/feeds", {
                handleAs: "json",
                data: JSON.stringify(object)
            }).then(function(response) {
                async.resolve(lang.mixin(object, response));
            }, function(err) {
                async.reject(err);
            });
            return async;
        },

        put: function(object, options) {
            var url = this.dataUrl + "/feeds/" + object._key;
            return request.put(url, {
                data: JSON.stringify(object)
            });
        },

        remove: function(id) {
            return request.delete(this.dataUrl + "/feeds/" + id);
        },

        query: function(query, options) {
            var self = this;
            var asyncRequest = request(this.dataUrl + "/feeds", {
                handleAs: "json"
            });
            var asyncResults = when(asyncRequest, function(results) {
                return results.map(function(feedData) {
                    var feed = new Feed(feedData);
                    feed.store = self;
                    return feed;
                });
            });
            return QueryResults(asyncResults);
        },

        getIdentity: function(object) {
          return object._key;
        },

        getChildren: function(object) {
            return this.query();
        },

        getArticleStore: function(feedId) {
            return Observable(new ArticleStore(this.dataUrl + "/feeds/" + feedId));
        }
    });
});
