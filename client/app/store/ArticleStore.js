define([
    "dojo/_base/declare",
    "dojo/request",
    "dojo/store/util/QueryResults"
], function(declare, request, QueryResults) {

    function readArticle(article) {
        article.date = new Date(article.date);
        return article;
    }

    return declare([], {
        _feedUrl: null,

        idProperty: "_id",
        constructor: function(feedUrl) {
            this._feedUrl = feedUrl;
        },

        getIdentity: function(object) {
            return object[this.idProperty];
        },

        put: function(article, options) {
            return request.put(this._feedUrl + "/article/" + encodeURIComponent(article._id), {
                headers: {
                    // DOJO TODO: File bug about case-sensitive Content-Type header. If the casing isn't like this, then the default content type overrides ours.
                    "Content-Type": "application/json"
                },
                data: JSON.stringify(article),
                handleAs: "json"
            }).then(readArticle);
        },

        query: function(query, options) {
            var asyncResults = request(this._feedUrl + "/articles", {
                handleAs: "json"
            }).then(function(results) {
                results.forEach(readArticle);
                return results;
            });
            return QueryResults(asyncResults);
        }
    });
});
