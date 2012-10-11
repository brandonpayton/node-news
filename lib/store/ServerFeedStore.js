define([
    "dojo/_base/lang",
    "dojo/_base/declare",
    "dojo/Deferred",
    "dojo/store/util/QueryResults",
    "dojo/node!guid",
    "lib/promiseLoad!lib/store/Model"
], function(lang, declare, Deferred, QueryResults, guid, Model) {
    var Group = Model.Group,
        Feed = Model.Feed,
        Article = Model.Article;

    return declare([ ], {
        get: function(id) {
            var async = new Deferred();
            Feed.get(id, lang.hitch(async, "resolve"));
            return async.promise
        },
    
        query: function(query, options) {
            var async = new Deferred();
            Feed.find().all(lang.hitch(async, "resolve"));
            return QueryResults(async.promise);
        },
    
        put: function(object, options) {
            var async = new Deferred();
            if(!object.id) {
                async.reject(new Error("Object has no _key."))
            } else {
                var feed = new Feed(object);
                feed.save(function(validationErrors) {
                    if(validationErrors) {
                        async.reject(validationErrors);
                    } else {
                        async.resolve(feed);
                    }
                });
            }
            return async.promise;
        },
    
        add: function(object, options) {
            var async = new Deferred();
            var feed = new Feed(object);
            feed.id = guid.raw();
            feed.save(function(validationErrors) {
                if(validationErrors) {
                    async.reject(validationErrors);
                } else {
                    async.resolve(feed);
                }
            });
            asyncSet.then(
              function() { debugger; async.resolve({ _key: key }) },
              function(err) { async.reject(err) }
            );
            return async.promise;
        },
    
        remove: function(id) {
            var async = new Deferred();
            Feed.delete(id, function(err) {
                if(err) { async.reject(err); }
                else { async.resolve(); }
            });
            return async.promise
        }
    });
});
