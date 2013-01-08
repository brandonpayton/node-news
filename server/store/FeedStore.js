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

        constructor: function(postgresClient) {
            this._postgresClient = postgresClient;
        },

        get: function(id) {
            var dfdGet = new Deferred();
            this._postgresClient.query(
                "SELECT * FROM get_feed(url := $1);",
                [ id ],
                nodeCallback(dfdGet)
            );
            return dfdGet.then(function(result) {
                var rows = result.rows;
                if(rows.length === 1) {
                    return rows[0];
                } else if(rows.length === 0) {
                    return undefined;
                } else {
                    throw new Error("Retrieved more than one result for id: '" + id + "'");
                }
            });
        },

        // OPP: Update dojo/store docs to cover a resolve/return convention for add() and put().
        add: function(object, options) {
            return this.put(object, options);
        },

        put: function(object, options) {
            // TODO: Consider explicit arg validation like the bake() operation I did for IGC. 
            if(object.type !== "feed") {
                throw new Exception("Only objects with type === 'feed' can be placed in the store.");
            }
                
            var dfdPut = new Deferred();
            this._postgresClient.query(
                "SELECT save_feed(url := $1, name := $2, tags := $3);",
                [ object.url, object.name, object.tags ],
                nodeCallback(dfdPut)
            );
            return dfdPut.promise;
        },

        remove: function(id) {
            var dfdRemove = new Deferred();
            this._postgresClient.query(
                "SELECT soft_delete_feed(url := $1);",
                [ id ],
                nodeCallback(dfdRemove)
            );
            return dfdRemove.promise;
        },

        query: function(query, options) {
            query = query || {};
            
            var asyncResults = new Deferred();
            if(query.tag !== undefined) {
                this._postgresClient.query(
                    "SELECT * FROM get_feeds_with_tag(tag := $1);",
                    [ query.tag ],
                    nodeCallback(asyncResults)
                );
            } else {
                this._postgresClient.query(
                    "SELECT * FROM get_tags_and_tagless_feeds();",
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
                            name: row.name,
                            url: row.url
                        }
                    } else {
                        throw new Error("Unknown row type: " + row.type);
                    }
                });
            }));
        },

        getArticleStore: function(feedId) {
            return new ArticleStore(this._postgresClient, feedId);
        },

        getIdentity: function(object) {
            var type = object.type;
            if(type === "feed") {
                return object.url;
            } else if(type === "tag") {
                return object.name;
            } else {
                throw new Error("Object of type '" + type + "' is not supported by this store.");
            }
            return object.url;
        }

    });
});
