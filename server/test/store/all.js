define([
    // NOTE: FeedStore and ArticleStore require asynchonous setUp()'s which DOH doesn't support.
    // TODO: Uncomment FeedStore test after converting to use mocked postgres client.
    //"./FeedStore"
    "./ArticleStore"
], function() {
    // Do nothing.
});
