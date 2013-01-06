define([
    'require',
    'server/store/FeedStore',
	'doh/main',
    'server/postgres',
    'dojo/string',
    'dojo/Deferred',
    'dojo/node!child_process',
    'dojo/text!server/data/create.sql',
    'dojo/text!./insertTestData.sql'
], function(require, FeedStore, doh, postgres, dojoString, Deferred, child_process, creationSql, insertionSql) {

    var databaseName = "news_test_feedstore",
        creationSql = dojoString.substitute(creationSql, { database_name: databaseName });

    function createDatabase() {
        return postgres.runPsqlScript(creationSql);
    }
    function createClient() {
        return postgres.createClient("tcp://localhost/" + databaseName);
    }

    createDatabase().then(createClient).then(function(client) {
        function setUp() { }
        function tearDown() {
            client.end();

            // Intentionally leaving test databases intact for troubleshooting purposes.
            // TODO: Should this be configurable?
        }

        doh.register("FeedStore", [
            function getIdentityForFeed() {

            },
            function getIdentityForTag() {

            },
            function queryAll() {
                // Return tags and tagless feeds
            },
            function queryWithTag() {
                // Return feeds
            },
            function add() {

            },
            function put() {

            },
            function delete() {

            }
        ], setUp, tearDown);

        doh.run();
    });
});
