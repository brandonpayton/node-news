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
                try {
                    // TODO: Consider whether feedUrl + guid should be key instead of separate id property.
                    var existingArticleQuery = {
                        feedUrl: feed.url,
                        guid: article.guid
                    };

                    articleSavePromises.push(
                        articleStore.query(existingArticleQuery).then(function(results) {
                            if(results.length === 0) {
                                return articleStore.add(article);
                            }
                        })
                    );
                } catch(err) {
                    console.error(err);
                }
            })
            .on("end", function() {
                all(articleSavePromises).then(function() {
                    dfdUpdate.resolve();    
                }, function(err) {
                    console.error(err);
                    dfdUpdate.resolve();
                });
            });

            return dfdUpdate.promise;
        },

        addFeed: function(feed) {
            var dfdSaveFeed = new Deferred(),
                feedStore = this._feedStore,
                feedSavePromise = null,
                url = feed.url,
                tags = feed.tags,
                self = this;

            feedparser.parseUrl(url)
            // TODO: Does 'error' signal the end of parsing or may feedparser encounter an error and continue?
            .on("error", function(error) {
                if(feedSavePromise === null) {
                    dfdSaveFeed.reject(error);
                }
            })
            .on("meta", function(metadata) {
                if(!dfdSaveFeed.isRejected()) {
                    try {
                        var feed = {
                            url: url,
                            name: metadata.title,
                            tags: tags
                        };
                        feedSavePromise = feedStore.add(feed);
                        feedSavePromise.then(function(feedResult) {
                            return self.updateFeed(feed).always(function() {
                                dfdSaveFeed.resolve(feedResult);
                            });
                        }).then(null, function(err) {
                            // TODO: What is a better way to catch both rejected feedSavePromise and exceptions in the feedSavePromise resolved handler?
                            dfdSaveFeed.reject(err);
                        });
                    } catch(err) {
                        dfdSaveFeed.reject(err);
                    }
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
