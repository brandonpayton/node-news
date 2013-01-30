define([
    "require",
    "dojo/when",
    "dojo/node!http",
    "dojo/node!send",
    "dojo/node!url",
    "dojo/Deferred",
    "./jsonLoader!./config.json",
    "./postgres",
    "./nodeCallback",
    "./store/FeedStore",
    "dojo/store/Observable",
    "./FeedRestApi",
    "./FeedUpdater"
], function(contextRequire, when, http, send, url, Deferred, config, postgres, nodeCallback, FeedStore, Observable, FeedRestApi, FeedUpdater) {

    var feedStore,
        feedUpdater;

    postgres.createClient(config.postgresConnectionString).then(function(postgresClient) {
        feedStore = new FeedStore(postgresClient);
        feedUpdater = new FeedUpdater(feedStore);

        return feedStore.query().then(function(allFeedsQueryResults) {
            setTimeout(function updateFeeds() {
                allFeedsQueryResults.forEach(function(feed) {
                    feedUpdater.queueFeed(feed);
                });
                // TODO: Need to think about how to do this better than update all at the same time.
                
                setTimeout(updateFeeds, 1000 * 60 * 30);
            }, 0);
        }, function(err) {
            console.error("Unable to get feeds list.");
            throw err;
        });
    }).then(function() {
        http.createServer(function(req, res) {
            var u = url.parse(req.url)
            console.log("connect", u.pathname)

            function error(err) {
                res.statusCode = err.status || 500
                res.end(err.message)
            }

            function redirect(path) {
                res.statusCode = 301;
                res.setHeader('Location', path);
                res.end('Redirecting to ' + path);
            }

            var feedRestApi = new FeedRestApi("/data/", feedStore, feedUpdater),
                clientUrlPattern = new RegExp("^/client|dojo/");

            if([ "", "/", "/client" ].indexOf(u.pathname) >= 0) {
                redirect("/client/client.html");
            } else if(clientUrlPattern.test(u.pathname)) {
                // Send static client resources.
                send(req, u.pathname)
                // TODO: How to get __dirname when using dojo loader?
                .root(contextRequire.toUrl(".") + "/..")
                .on('error', console.error)
                .pipe(res);
            } else if(feedRestApi.isApiPath(u.pathname)) {
                console.log("data", u.pathname);
                feedRestApi.serve(req, res);
            } else {
                res.statusCode = 404;
                res.end(http.STATUS_CODES[404]);
            }
        }).listen(config.httpServerPort);
    }, function(err) {
        console.error(err);
        process.exit(-1);
    });
});
