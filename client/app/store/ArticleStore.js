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
        dataUrl: null,

        constructor: function(args) {
            declare.safeMixin(this, args);
        },

        getIdentity: function(object) {
            return object.id;
        },

        // TODO: Migrate articles to use composite Primary Key (feedUrl+guid). Currently, this store is broken.
        get: function(id) {
            return request(this._getArticleUrl(id), {
                handleAs: "json"
            }).then(readArticle);
        },

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

        query: function(query, options) {
            var queryUrl = this.dataUrl;
            if(query.feedUrl !== undefined) {
                queryUrl += "/feed/" + encodeURIComponent(query.feedUrl) + "/articles";
            } else if(query.tag !== undefined) {
                queryUrl += "/tag/" + query.tag + "/articles";
            } else {
            }
            
            var asyncResults = request(queryUrl, {
                handleAs: "json"
            }).then(function(results) {
                results.forEach(readArticle);
                return results;
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
