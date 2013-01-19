define([
    'require',
    'server/store/FeedStore',
	'doh/main',
    'server/postgres',
    'dojo/_base/lang',
    'dojo/string',
    'dojo/Deferred',
    'dojo/node!child_process',
    'dojo/text!server/data/create.sql'
], function(require, FeedStore, doh, postgres, lang, dojoString, Deferred, child_process, creationSqlTemplate) {

    var databaseName = "news_test_feedstore",
        creationSql = dojoString.substitute(creationSqlTemplate, { database_name: databaseName }),
        feeds,
        feedsByTag;

    function createDatabase() {
        return postgres.runPsqlScript(creationSql);
    }
    function createClient() {
        return postgres.createClient("tcp://localhost/" + databaseName);
    }
    function insertTestData() {
        var feedDataFileName = require.toUrl("./feedData.csv"),
            tagDataFileName = require.toUrl("./tagData.csv");

        var sqlQuery = 
            "COPY feed (url, name) FROM '" + feedDataFileName + "' WITH csv;" +
            "COPY tag_to_feed (tag, feed_url) FROM '" + tagDataFileName + "' WITH csv;";
        return client.query(sqlQuery);                
    }

    var client = null;
    createDatabase().then(createClient).then(function(postgresClient) {
        client = postgresClient;
        return insertTestData();
    }).then(function() {
        function setUp() { }
        function tearDown() {
            client.end();
            // Intentionally leaving test databases intact for troubleshooting purposes.
            // TODO: Should this be configurable?
        }

        doh.register("FeedStore", [
            function getIdentityForFeed(t) {
                var store = new FeedStore();
                t.assertEqual("expectedValue", store.getIdentity({ type: "feed", name: "a feed", url: "expectedValue" }));
            },
            function getIdentityForTag(t) {
                var store = new FeedStore();
                t.assertEqual("expectedValue", store.getIdentity({ type: "tag", name: "expectedValue" })); 
            },
            function queryTagsAndTaglessFeeds(t) {
                var dfd = new doh.Deferred();

                // NOTE: This test doesn't verify particular tags and tagless feeds are present,
                // just that that's all the query returns. Making this compromise so I can move on for the time being.
                // TODO: Give this test it's own DB instance and dedicated data set if it doesn't take too long to execute.
                var store = new FeedStore(client);
                store.query().then(dfd.getTestCallback(function(results) {
                    t.assertTrue(results.every(function(item) {
                        return item.type === "tag" || (item.type === "feed" && item.tags.length === 0);
                    }));
                }), lang.hitch(dfd, "errback"));

                return dfd;
            },
            function queryTaggedFeeds(t) {
                var dfd = new doh.Deferred();

                // TODO: Require feed and tag CSV data and verify against that rather than using knowledge obtained from a human glancing at those files.
                var EXPECTED_RESULT_URLS = [
                    'https://blog.mozilla.org/javascript/feed/',
                    'http://www.modernperlbooks.com/mt/atom.xml'
                ];
                var store = new FeedStore(client);
                store.query({ tag: "language" }).then(dfd.getTestCallback(function(results) {
                    results.forEach(function(result, index) {
                        t.assertEqual(result.url, EXPECTED_RESULT_URLS[index]);
                    });
                }), lang.hitch(dfd, "errback"));

                return dfd;
            },
            function add(t) {
                var dfd = new doh.Deferred();
                var feed = {
                    type: 'feed',
                    name: 'Chromium Blog',
                    url: 'http://blog.chromium.org/feeds/posts/default'
                };
                var store = new FeedStore(client);

                store.add(feed).then(function() {
                    return store.get(store.getIdentity(feed));
                }).then(dfd.getTestCallback(function(retrievedFeed) {
                    Object.keys(feed).forEach(function(key) {
                        t.assertEqual(feed[key], retrievedFeed[key]);
                    });
                }), lang.hitch(dfd, "errback"));
                return dfd;
            },
            function put(t) {
                var dfd = new doh.Deferred();
                var counter = 0;

                var feed = {
                    type: 'feed',
                    name: 'IEBlog',
                    url: 'http://blogs.msdn.com/b/ie/rss.aspx',
                    deleted: false,
                    tags: [ 'ms', 'ie' ]
                };
                var store = new FeedStore(client);

                store.add(feed).then(function() {
                    var EXPECTED_NAME = "Internet Explorer Blog";
                    feed.name = EXPECTED_NAME;
                    return store.put(feed);
                }).then(function() {
                    return store.get(store.getIdentity(feed));
                }).then(dfd.getTestCallback(function(retrievedFeed) {
                    Object.keys(feed).forEach(function(key) {
                        t.assertEqual(feed[key], retrievedFeed[key]);
                    });
                }), lang.hitch(dfd, "errback"));
                return dfd;
            },
            function remove(t) {
                var dfd = new doh.Deferred();

                var feed = {
                    type: 'feed',
                    name: 'Opera Desktop Team',
                    url: 'http://my.opera.com/desktopteam/xml/rss/blog/',
                    tags: [ 'norway' ]
                };
                var store = new FeedStore(client);
                store.add(feed).then(function() {
                    return store.remove(store.getIdentity(feed));
                }).then(function() {
                    // Verify the deleted flag is set.
                    return store.get(store.getIdentity(feed)).then(dfd.getTestCallback(function(retrievedFeed) {
                        t.assertEqual(true, retrievedFeed.deleted);
                    }));
                }).then(function() {
                    // Verify that a query does not include the feed.
                    return store.query({ tag: 'norway' }).then(dfd.getTestCallback(function(queryResults) {
                        t.assertEqual(false, queryResults.some(function(item) {
                            return store.getIdentity(feed) === store.getIdentity(item);
                        }));
                    }));
                }, lang.hitch(dfd, "errback"));

                return dfd;
            }
        ], setUp, tearDown);

        doh.run();
    });
});
