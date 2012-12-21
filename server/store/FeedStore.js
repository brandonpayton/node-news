define([
    "dojo/_base/lang",
    "dojo/_base/declare",
    "dojo/request",
    "dojo/Deferred",
    "dojo/store/util/QueryResults",
    "dojo/node!url",
    "./ArticleStore"
], function(lang, declare, request, Deferred, QueryResults, url, ArticleStore) {
    return declare([ ], {
        // Base URL
        _couchDbUrl: null,

        // TODO: How to document this in Dojo format?
        constructor: function(couchDbUrl) {
            this._couchDbUrl = couchDbUrl;
        },

        get: function(id) {
            return request.get(
                this._couchDbUrl + "/" + encodeURIComponent(id),
                { handleAs: "json" }
            ).response.then(function(r) {
                if(r.status === 200) {
                    return r.data;
                } else if(r.data.error === "not_found") {
                    return undefined;
                } else {
                    throw new Error(r.data.error + ": " + r.data.reason);
                }
            });
        },

        // OPP: Update dojo/store docs to cover a resolve/return convention for add() and put().
        add: function(object, options) {
            return this.put({
                _id: object.url,
                type: 'feed',
                title: object.title,
                url: object.url
            }, options);
        },

        put: function(object, options) {
            // TODO: Consider explicit arg validation like the bake() operation I did for IGC. 
            if(object.type !== "feed") {
                throw new Exception("Only objects with type === 'feed' can be placed in the store.");
            }
                
            return request.put(
                this._couchDbUrl + "/" + encodeURIComponent(this.getIdentity(object)),
                {
                    data: JSON.stringify(object),
                    headers: {
                        "Content-type": "application/json"
                    },
                    handleAs: "json"
                }
            ).response.then(function(r) {
                var data = r.data;
                if(r.status === 201) {
                    console.log("Done putting feed: " + object._id);
                    return lang.mixin({}, object, { _rev: data.rev });
                } else {
                    // TODO: Implement conflict resolution.
                    // TODO: Factor this into CouchError.
                    throw new Error(data.error + ": " + data.reason);
                }
            });
        },

        remove: function(id) {
            return this.get(id).then(lang.hitch(this, function(feed) {
                feed.deleted = true;
                return this.put(feed);
            }));
        },

        query: function(query, options) {
            var viewUrl = this._couchDbUrl + "/_design/news/_view/feeds";
            query = query || {};

            if(query.tag !== undefined) {
                var params = [
                    "startkey=" + JSON.stringify([ query.tag, 0 ]),
                    "endkey=" + JSON.stringify([ query.tag, {} ])
                ];
                viewUrl = viewUrl + "?" + params.join("&"); 
                console.log("VIEW", viewUrl);
            }
            
            return QueryResults(request(viewUrl, { handleAs: "json" }).then(function(results) {
                return results.rows.map(function(row) { return row.value; });
            }));
        },

        getTags: function() {
            var viewUrl = this._couchDbUrl + "/_design/news/_view/tags?group_level=1";
            return request(viewUrl, { handleAs: "json" }).then(function(results) {
                return results.rows.map(function(row) {
                    return {
                        type: "tag",
                        name: row.key
                    };
                });
            });
        },

        getArticleStore: function(feedId) {
            return new ArticleStore(this._couchDbUrl, feedId);
        },

        getIdentity: function(object) {
            return object.url;
        }

    });
});
