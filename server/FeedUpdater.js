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
            var asyncJob = new Deferred(),
                feedStore = this._feedStore,
                meta = null;

            // TODO: Handle "error" event if there is one and create aggregate error notification article for this feed.
            feedparser.parseUrl(feed._id)
            .on("article", function(article) {
                var articleStore = feedStore.getArticleStore(feed._id);
                var articleId = articleStore.getIdentity(article);
                asyncJob.progress({
                    type: "SavingArticle",
                    promise: articleStore.get(articleId).then(function(doc) {
                        if(doc === undefined) {
                            return articleStore.add(article);
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

            feedparser.parseUrl(url)
            // TODO: Does 'error' signal the end of parsing or may feedparser encounter an error and continue?
            .on("error", function(error) {
                asyncJob.reject(error);
            })
            .on("meta", function(metadata) {
                feedSavePromise = feedStore.add({
                    url: url,
                    name: metadata.title
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
                            // This article has not yet been added.
                            return articleStore.add(article);
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
