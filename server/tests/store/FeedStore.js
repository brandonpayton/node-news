define([
    'require',
    'server/store/FeedStore',
	'doh/main',
    'server/postgres',
    'server/nodeCallback',
    'dojo/_base/lang',
    'dojo/string',
    'dojo/Deferred',
    'dojo/node!child_process',
    'dojo/text!server/data/create.sql'
], function(require, FeedStore, doh, postgres, nodeCallback, lang, dojoString, Deferred, child_process, creationSqlTemplate) {

    var databaseName = "news_test_feedstore",
        creationSql = 
            "DROP DATABASE " + databaseName + ";\n" +
            dojoString.substitute(creationSqlTemplate, { database_name: databaseName }),
        feeds,
        feedsByTag;

    function createDatabase() {
        return postgres.runPsqlScript(creationSql);
    }
    function createClient() {
        return postgres.createClient("tcp://localhost/" + databaseName);
    }
    function insertTestData() {
        var dfdInsert = new Deferred(),
            feedDataFileName = require.toUrl("./feedData_orderedByName.csv"),
            tagDataFileName = require.toUrl("./tagData_orderedByTagAndFeedName.csv");

        var sqlQuery = 
            "COPY feed (url, name) FROM '" + feedDataFileName + "' WITH csv;" +
            "COPY tag_to_feed (tag, feed_url) FROM '" + tagDataFileName + "' WITH csv;";
        client.query(sqlQuery, nodeCallback(dfdInsert));                
        return dfdInsert.promise;
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

                // TODO: Require feed and tag CSV data and verify against that rather than using knowledge obtained from a human glancing at those files.
                // NOTE: This test has the weakness that it must run before the add, insert, delete tests.
                var EXPECTED_TAGS = [ "dojo", "language", "perl", "web" ];
                var EXPECTED_RESULT_URLS = [
                    "https://blog.mozilla.org/security/feed/",
                    "http://drmcninja.com/feed/"
                ];
                var store = new FeedStore(client);
                store.query().then(dfd.getTestCallback(function(results) {
                    t.assertTrue(results.every(function(item) { return item.type in { tag: 1, feed: 1}; }));

                    var tags = results.filter(function(item) { return item.type === "tag"; });
                    tags.forEach(function(tag, i) {
                        t.assertEqual(tag.name, EXPECTED_TAGS[i]);
                    });

                    var feeds = results.filter(function(item) { return item.type === "feed"; });
                    feeds.forEach(function(feed, i) {
                        t.assertEqual(feed.url, EXPECTED_RESULT_URLS[i]);
                    });
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
                    debugger;
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

                var feed = {
                    type: 'feed',
                    name: 'IEBlog',
                    url: 'http://blogs.msdn.com/b/ie/rss.aspx',
                    deleted: false,
                    tags: [ 'ms', 'ie' ]
                };
                var store = new FeedStore(client);

                store.add(feed).then(function() {
                    debugger;
                    var EXPECTED_NAME = "Internet Explorer Blog";
                    feed.name = EXPECTED_NAME;
                    return store.put(feed);
                }).then(function() {
                    return store.get(store.getIdentity(feed));
                }).then(dfd.getTestCallback(function(retrievedFeed) {
                    debugger;
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
                        t.assertEqual(true, feed.deleted);
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
