define([
    "require",
    "dojo/when",
    "dojo/node!http",
    "dojo/node!send",
    "dojo/node!url",
    "dojo/node!sofa",
    "./store/FeedStore",
    "dojo/store/Observable",
    "./FeedRestApi",
    "./FeedUpdater"
], function(contextRequire, when, http, send, url, Sofa, FeedStore, Observable, FeedRestApi, FeedUpdater) {

    var couchDbUrl = "http://localhost:5984/new-news",
        feedStore = Observable(new FeedStore(couchDbUrl)),
        feedUpdater = new FeedUpdater(feedStore),
        feedRestApi = new FeedRestApi(feedStore, feedUpdater);

    var allFeedsQueryResults = feedStore.query();
    when(allFeedsQueryResults, function() {
        allFeedsQueryResults.observe(function(feed, removedFrom, insertedInto) {
            if(removedFrom > 0) {
                if(insertedInto > 0) {
                    // Updated. For now, do nothing.
                } else {
                    // Deleted. Do nothing.
                }
            } else {
                // Added.
                feedUpdater.updateFeed(feed);
            }
        });
        setTimeout(function updateFeeds() {
            allFeedsQueryResults.forEach(feedUpdater.queueFeed.bind(feedUpdater));
            // TODO: Need to think about how to do this better than update all at the same time.
            
            setTimeout(updateFeeds, 1000 * 60 * 30);
        }, 0);
    }, function(err) {
        console.error("Unable to get feeds list. " + err);
        process.exit(-1);
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

            var clientUrlPattern = new RegExp("^/client|dojo/"),
                dataUrlPattern = new RegExp("^/data(/.*)"),
                match,
                dataPath;

            if([ "", "/", "/client" ].indexOf(u.pathname) >= 0) {
                redirect("/client/client.html");
            } else if(clientUrlPattern.test(u.pathname)) {
                // Send static client resources.
                send(req, u.pathname)
                // TODO: How to get __dirname when using dojo loader?
                .root(contextRequire.toUrl(".") + "/..")
                .on('error', console.error)
                .pipe(res);
            } else if(match = dataUrlPattern.exec(u.pathname)) {
                console.log("data", u.pathname);
                dataPath = match[1];
                feedRestApi.serve(dataPath, req, res);
            } else {
                res.statusCode = 404;
                res.end(http.STATUS_CODES[404]);
            }
        }).listen(8080);
    });
});
