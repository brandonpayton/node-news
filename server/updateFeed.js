define([
    "dojo/_base/lang",
    "dojo/Evented",
    "dojo/Deferred",
    "dojo/node!feedparser"
], function(lang, Evented, Deferred, feedparser) {
    return function updateFeed(feedStore, url) {
        var asyncJob = new Deferred(),
            meta = null;

        feedparser.parseUrl(url)
        .on("meta", function(metadata) {
            meta = metadata;
            asyncJob.progress({
                type: "SavingFeed",
                promise: feedStore.put({
                    url: url,
                    title: meta.title
                })
            });
        })
        .on("article", function(article) {
            asyncJob.progress({
                type: "SavingArticle",
                promise: feedStore.getArticleStore(url).put(article)
            });
        })
        .on("end", function() {
            // TODO: Errors can happen with individual articles, but if there is one error should the entire job be considered a failure?
            asyncJob.resolve();
        });

        return asyncJob;
    };
});
