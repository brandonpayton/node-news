define([
    "dojo/_base/declare",
    "dojo/request",
    "dojo/store/util/QueryResults"
], function(declare, request, QueryResults) {
    return declare([], {
        _feedUrl: null,

        idProperty: "_id",
        constructor: function(feedUrl) {
            this._feedUrl = feedUrl;
        },

        getIdentity: function(object) {
            return object[this.idProperty];
        },

        query: function(query, options) {
            var asyncResults = request(this._feedUrl + "/articles", {
                handleAs: "json"
            }).then(function(results) {
                results.forEach(function(article) {
                    article.date = new Date(article.date);
                });
                return results;
            });
            return QueryResults(asyncResults);
        }
    });
});
