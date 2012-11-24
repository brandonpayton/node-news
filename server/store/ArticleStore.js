define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/Deferred",
    "../sofaCallback"
], function(declare, lang, Deferred, sofaCallback) {
    return declare(null, {
        _couchDb: null,
        _feedId: null,

        getIdentity: function(obj) {
            // Identify each article by feed, date, and link.
            // Rationale: 
            //  1) It's possible the same link could be referenced by different feeds so distinguish by feed.
            //  2) If an article is updated and reposted at the same link but with a different date,
            //      it should show up as a new article because the previous version of the article might have
            //      already been read and deleted. It's better for the user to get a new article than to miss 
            //      the update or possible go against their wishes by resurrecting the article they've already deleted.
            return obj._id || encodeURIComponent([ this._feedId, obj.date, obj.link ].join("_"));
        },

        constructor: function(couchDb, feedId) {
            this._couchDb = couchDb;
            this._feedId = feedId;
        },

        add: function(articleData) {
            return this.put(articleData);
        },

        get: function(id) {
            var async = new Deferred();
            this._couchDb.get(encodeURIComponent(id), sofaCallback(async));
            return async.then(null, function(err) {
                var x = id;
                // TODO: Drop CouchDB wrapper for straight access to Couch.
                if(err.message !== "not_found: missing") {
                    debugger;
                    throw err;
                }
            });
        },

        put: function(articleData) {
            var article = {
                _id: this.getIdentity(articleData),
                type: "article",
                feedId: this._feedId,
                categories: []
            };

            [
                "link",
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
                //debugger;
            }, function(error) {
                //debugger;                 
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
                    reduce: false,
                    descending: true
                },
                callback: sofaCallback(async)
            });
            return async.then(function(results) {
                return results.rows.map(function(row) { return row.value; });         
            });
        }
    });
});
