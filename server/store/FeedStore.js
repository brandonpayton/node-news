define([
       "dojo/_base/lang",
       "dojo/_base/declare",
       "dojo/Deferred",
       "dojo/store/util/QueryResults",
       "dojo/node!url",
       "../sofaCallback",
       "./ArticleStore"
], function(lang, declare, Deferred, QueryResults, url, sofaCallback, ArticleStore) {

    function normalizeUrlStr(urlStr) {
        var u = url.parse(urlStr);
        u.host = u.host.toLowerCase();
        u.protocol = u.protocol.toLowerCase();
        return url.format(urlStr);
    }

    return declare([ ], {
        // Base URL
        _couchDb: null,

        // TODO: How to document this in Dojo format?
        constructor: function(couchDb) {
            this._couchDb = couchDb;
        },

        get: function(id) {
            var async = new Deferred()
            this._couchDb.get(id, sofaCallback(async))
            return async.promise
        },

        query: function(query, options) {
            var async = new Deferred();
            // TODO: Why do we have to repeat the base path of /news here?
            this._couchDb.view({
                doc: "news",
                view: "feeds",
                params: query,
                callback: sofaCallback(async)
            });
            return QueryResults(async.then(function(results) {
                return results.rows.map(function(row) { return row.value; });         
            }));
        },

        put: function(object, options) {
            // TODO: Consider explicit arg validation like the bake() operation I did for IGC. 
            if(object.type !== "feed") {
                throw new Exception("Only objects with type === 'feed' can be placed in the store.");
            }
            var async = new Deferred();
            // TODO: Switch to lang.delegate after switching from CouchDB wrapper to raw access
            this._couchDb.save(lang.mixin({}, object, { _id: encodeURIComponent(object._id) }), sofaCallback(async));
            return async.then(function(response) { return object; });
        },

        // OPP: Update dojo/store docs to cover a resolve/return convention for add() and put().
        add: function(object, options) {
            // TODO: Change mixin to delegate when switching from CouchDB
            return this.put(lang.mixin(object, {
                _id: encodeURIComponent(object.url),
                type: 'feed'
            }), options);
        },

        remove: function(id) {
            return this.get(id).then(lang.hitch(this, function(feed) {
                feed.deleted = true;
                return this.put(feed);
            }));
        },

        getArticleStore: function(feedId) {
            return new ArticleStore(this._couchDb, feedId);
        }
    });
});