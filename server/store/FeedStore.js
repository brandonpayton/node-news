define([
    "dojo/_base/lang",
    "dojo/_base/declare",
    "dojo/Deferred",
    "dojo/store/util/QueryResults",
    "./ArticleStore",
    "../nodeCallback"
], function(lang, declare, Deferred, QueryResults, ArticleStore, nodeCallback) {
    return declare([ ], {
        _postgresClient: null,

        // TODO: How to document this in Dojo format?
        constructor: function(postgresClient) {
            this._postgresClient = postgresClient;
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
            query = query || {};
            
            var asyncResults = new Deferred();
            if(query.tag !== undefined) {
                this._postgresClient.query(
                    "SELECT get_feeds_with_tag(tag := $1);",
                    [ query.tag ],
                    nodeCallback(asyncResults)
                );
            } else {
                this._postgresClient.query(
                    "SELECT get_tags_and_tagless_feeds();",
                    nodeCallback(asyncResults)
                );
            }

            return QueryResults(asyncResults.then(function(result) {
                return result.rows.map(function(row) {
                    if(row.type === "tag") {
                        return {
                            type: "tag",
                            name: row.name
                        };
                    } else if(row.type === "feed") {
                        return {
                            type: "feed",
                            id: row.id,
                            name: row.name,
                            url: row.url
                        }
                    } else {
                        throw new Error("Unknown row type: " + row.type);
                    }
                });
            }));
        },

        getTags: function() {
            return [];
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
