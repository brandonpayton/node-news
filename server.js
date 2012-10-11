define([
  "dojo/node!http"
  , "dojo/node!send"
  , "dojo/node!url"
  , "lib/store/ServerFeedStore"
  , "lib/FeedRestApi"
], function(http, send, url, FeedStore, FeedRestApi) {
  FeedStore.open("news.tiny").then(function(feedStore) {
    var feedRestApi = new FeedRestApi(feedStore)

    http.createServer(function(req, res) {
      var u = url.parse(req.url)
      console.log("connect", u.pathname)

      function error(err) {
        res.statusCode = err.status || 500
        res.end(err.message)
      }

      function redirect(path) {
        res.statusCode = 301
        res.setHeader('Location', path)
        res.end('Redirecting to ' + path)
      }

      var clientUrlPattern = new RegExp("^/client/")
        , dataUrlPattern = new RegExp("^/data(/.*)")
        , match
        , dataPath
      
      if([ "", "/", "/client" ].indexOf(u.pathname) >= 0) {
        redirect("/client/client.html")
      } else if(clientUrlPattern.test(u.pathname)) {
        // Send static client resources.
        debugger;
        send(req, u.pathname)
        // TODO: How to get __dirname when using dojo loader?
        .root(require.toUrl("news"))
        .on('error', console.error)
        .pipe(res)
      } else if(match = dataUrlPattern.exec(u.pathname)) {
        console.log("data", u.pathname)
        dataPath = match[1]
        feedRestApi.serve(dataPath, req, res)
      } else {
          res.statusCode = 404
          res.end(http.STATUS_CODES[404])
      }
    }).listen(8080)
  })
})
