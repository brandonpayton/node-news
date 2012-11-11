define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/Deferred",
    "../sofaCallback"
], function(declare, lang, Deferred, sofaCallback) {
    return declare(null, {
        _couchDb: null,
        _feedId: null,
        constructor: function(couchDb, feedId) {
            this._couchDb = couchDb;
            this._feedId = feedId;
        },

        add: function(articleData) {
            return this.put(articleData);
        },

        put: function(articleData) {
            var article = {
                type: "article",
                feedId: this._feedId,
                categories: []
            };

            [
                "title",
                "author",
                "date",
                "description",
                "categories"
            ].forEach(function(name) {
                if(articleData[name] !== undefined) {
                    article[name] = articleData[name];
                }
            });

            var async = new Deferred();
            this._couchDb.save(article, sofaCallback(async));
            return async.then(function(result) {
                debugger;
            });
        },

        query: function(query, options) {
            var async = new Deferred();
            this._couchDb.view({
                doc: "news",
                view: "articles",
                params: {
                    startkey: [ this._feedId, {} ],
                    endkey: [ this._feedId, 0 ],
                    descending: true
                },
                callback: sofaCallback(async)
            });
            return async.then(function(results) {
                debugger;
                return results.rows.map(function(row) { return row.value; });         
            });
        }
    });
});
