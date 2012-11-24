define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/Deferred",
    "dojo/node!feedparser"
], function(declare, lang, Deferred, feedparser) {
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
                var async = this.updateFeed(feed);
                this._inProgressCount += 1;
                
                var after = lang.hitch(this, function() {
                    this._inProgressCount -= 1;
                    this._nextUpdateIfPossible();
                });
                async.then(after, after);
            }
        },

        queueFeed: function(feed) {
            this._queuedFeeds.push(feed);
            this._nextUpdateIfPossible();
        },

        updateFeed: function(feed) {
            if(feed === undefined) {
                debugger;
            }
            var asyncJob = new Deferred(),
                feedStore = this._feedStore,
                meta = null;

            // TODO: Handle "error" event if there is one and create aggregate error notification article for this feed.
            feedparser.parseUrl(feed._id)
            .on("meta", function(metadata) {
                meta = metadata;
                console.log("Updating feed.");
                if(metadata.title && feed.title !== metadata.title) {
                    feed.title = metadata.title;
                    asyncJob.progress({
                        type: "SavingFeed",
                        promise: feedStore.put(feed)
                    });
                }
            })
            .on("article", function(article) {
                var articleStore = feedStore.getArticleStore(feed._id);
                var articleId = articleStore.getIdentity(article);
                console.log("Adding article during update: " + articleId);
                asyncJob.progress({
                    type: "SavingArticle",
                    promise: articleStore.get(articleId).then(function(doc) {
                        if(doc === undefined) {
                            return articleStore.add(article);
                        } else {
                            debugger;
                            // TODO: Create debug log to track server behavior and catch weak handling of broken feeds.
                        }
                    })
                });
            })
            .on("end", lang.hitch(asyncJob, "resolve"));

            return asyncJob;
        },

        addFeed: function(url) {
            var asyncJob = new Deferred(),
                feedStore = this._feedStore,
                feedSavePromise = null;

            // TODO: Handle "error" event if there is one and create aggregate error notification article for this feed.
            feedparser.parseUrl(url)
            .on("meta", function(metadata) {
                feedSavePromise = feedStore.add({
                    url: url,
                    title: metadata.title
                });

                asyncJob.progress({
                    type: "SavingFeed",
                    promise: feedSavePromise
                });
            })
            .on("article", function(article) {
                var articleStore = feedStore.getArticleStore(url);
                var articleId = articleStore.getIdentity(article);
                asyncJob.progress({
                    type: "SavingArticle",
                    promise: articleStore.get(articleId).then(function(doc) {
                        if(doc === undefined) {
                            return articleStore.put(article);
                        } else {
                            // TODO: Create debug log to track server behavior and catch weak handling of broken feeds.
                        }
                    })
                });
            })
            .on("end", function() {
                if(feedSavePromise === null) {
                    asyncJob.reject(new Error("Unable to find or save feed metadata."));
                } else {
                    feedSavePromise.then(lang.hitch(asyncJob, "resolve"), lang.hitch(asyncJob, "reject"));
                }
            });

            return asyncJob;

        }
    });
});
