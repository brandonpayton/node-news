define([
    "dojo/when",
    "dojo/node!feedparser",
    "lib/store/ServerFeedStore"
], function(when, FeedParser, ServerFeedStore) {
    debugger;
    var feedStore = new ServerFeedStore();
    var feeds = feedStore.query();
    debugger;
    when(feeds, function(feeds) {
        feeds.forEach(function(feed) {
            var parser = new FeedParser();
            parser.parseUrl(source.url, function(error, meta, articles) {
                if(error) {
                    console.error(error);
                } else { 
                    when(feed.getArticleStore(), function(articleStore) {
                        var existingArticleResults = articleStore.query({ guid: article.guid });
                        when(existingArticleResults.total, function(numMatches) {
                            if(numMatches === 0) {
                                articleStore.add({
                                    feedId: feed.id, 
                                    guid: article.guid,
                                    link: article.link,
                                    title: article.title,
                                    author: article.author,
                                    categories: article.categories,
                                    date: article.date,
                                    description: article.description,
                                    unread: true
                                });
                            }
                        });
                    });
                }
            });
        });
    });
});
