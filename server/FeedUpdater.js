define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/Deferred",
    "dojo/promise/all",
    "dojo/node!feedparser"
], function(declare, lang, Deferred, all, feedparser) {
    return declare(null, {
        _feedStore: null,
        _queuedFeeds: [],

        // TODO: Think of better name.
        _windowSize: 5,
        _inProgressCount: 0,

        constructor: function(feedStore) {
            this._feedStore = feedStore;
        },

        _nextUpdateIfPossible: function() {
            if(this._queuedFeeds.length > 0 && this._inProgressCount < this._windowSize) {
                var feed = this._queuedFeeds.shift();
                var promiseToUpdate = this.updateFeed(feed);
                this._inProgressCount += 1;
                
                var after = lang.hitch(this, function() {
                    this._inProgressCount -= 1;
                    this._nextUpdateIfPossible();
                });
                promiseToUpdate.then(after, after);
            }
        },

        queueFeed: function(feed) {
            this._queuedFeeds.push(feed);
            this._nextUpdateIfPossible();
        },

        updateFeed: function(feed) {
            var dfdUpdate = new Deferred(),
                feedStore = this._feedStore,
                articleStore = feedStore.getArticleStore(feed.url),
                articleSavePromises = [];

            // TODO: Handle "error" event if there is one and create aggregate error notification article for this feed.
            feedparser.parseUrl(feed.url)
            .on("article", function(article) {
                // TODO: Consider whether feedUrl + guid should be key instead of separate id property.
                var articleQuery = {
                    feedUrl: feed.url,
                    guid: article.guid
                };

                articleSavePromises.push(
                    articleStore.query(articleQuery).then(function(results) {
                        if(results.length === 0) {
                            return articleStore.add(article);
                        }
                    })
                );
            })
            .on("end", function() {
                var resolve = lang.hitch(dfdUpdate, "resolve");
                all(articleSavePromises, resolve, resolve);
            });

            return dfdUpdate.promise;
        },

        addFeed: function(feed) {
            var dfdSaveFeed = new Deferred(),
                feedStore = this._feedStore,
                feedSavePromise = null,
                url = feed.url,
                tags = feed.tags;

            feedparser.parseUrl(url)
            // TODO: Does 'error' signal the end of parsing or may feedparser encounter an error and continue?
            .on("error", function(error) {
                if(feedSavePromise === null) {
                    dfdSaveFeed.reject(error);
                }
            })
            .on("meta", function(metadata) {
                if(!dfdSaveFeed.isFulfilled()) {
                    var feed = {
                        url: url,
                        name: metadata.title,
                        tags: tags
                    };
                    feedSavePromise = feedStore.add(feed);
                    feedSavePromise.then(function(feedResult) {
                        function resolve() { dfdSaveFeed.resolve(feedResult); }
                        return feedUpdater.updateFeed(feed).then(resolve, resolve);
                    }, function(err) {
                        dfdSaveFeed.reject(err);
                    });
                }
            })
            .on("end", function() {
                if(!dfdSaveFeed.isFulfilled() && feedSavePromise === null) {
                    dfdSaveFeed.reject(new Error("Unable to find or save feed metadata."));
                }
            });

            return dfdSaveFeed.promise;
        }
    });
});
