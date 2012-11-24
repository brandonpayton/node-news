define([
  "dojo/_base/lang",
  "dojo/_base/declare",
  "dojo/node!stream",
  "dojo/Deferred",
  "dojo/when",
  "dojo/promise/all",
  "dojo/request",
  "dojo/node!tiny",
  "dojo/node!http"
], function(lang, declare, Stream, Deferred, when, all, request, Tiny, http) {

  function error(res, statusCode, err) {
    var res = this.res;
    var msg = http.STATUS_CODES[status];
    err = err || new Error(msg);
    err.status = status;
    if (this.listeners('error').length) return this.emit('error', err);
    res.statusCode = err.status;
    res.end(msg);   
  }

  function dataNotFound(res) {
    res.statusCode = 404
    res.end(http.STATUS_CODES[404])
  }
  function unsupportedHttpMethod(res) {
    res.statusCode = 405
    res.end(http.STATUS_CODES[405])
  }

  function readAllData(req) {
    var asyncData = new Deferred()

    var stringBuffer = [ ]
    req.setEncoding('utf8')
    req.on('data', function(data) { stringBuffer.push(data) })
    .on('error', function(err) { asyncData.reject(err) })
    .on('end', function() { asyncData.resolve(stringBuffer.join("")) })

    return asyncData.promise
  }
  
  function serveJson(res, data) {
    res.setHeader('Content-Type', "application/json")
    res.end(JSON.stringify(data))
  }

  function completeRequest(dataPromise) {
    dataPromise.then(function(data) {
      serveJson(res, data)
    }, function(err) {
      error(500, err)
    })
  }

  return declare([], {
    _store: null,
    constructor: function(feedStore) {
      this._store = feedStore
    },
    serve: function(dataPath, req, res) {
      // TODO: Factor into feedUrl object and unit test parse().
      // Remove leading and trailing slashes
      var dataPath = this.dataPath.replace(/^\//, "").replace(/\/$/, "")
      var parts = dataPath.split("/")

      // No part may be empty.
      if(parts.some(function(part) { return part === "" })) {
        dataNotFound()
      }
      console.log(parts)
      var method = req.method;
      if(parts.shift() === "feeds") {
        if(parts.length === 0) {
          // Feeds. Supported methods: GET and POST
          if(method === "GET") {
            console.log("Getting feed list...")
            // Get feeds list
            completeRequest(this._store.query(function(item) { return item.type === "source" }))
          } else if(method === "POST") {
            // Create feed and return JSON
/*            all([ getUUID(), dataPromise ]).then(function(results) {
              var uuid = results[0]
                , data = results[1]
                , url = baseUrl + "/" + uuid;
                
              // TODO: Its not the best idea to pass the JSON straight to the DB without examining. Deserialize and reserialize before PUT.
              request.put(url, {
                // TODO: Change type to 'feed'
                data: lang.delegate(data, { type: 'source' })
              }).then(function() {
                res.statusCode = 201
                res.end(http.STATUS_CODES[201])
              }, function(err) {
                error(500, err)
              })
            }, function(err) {
              error(500, err)
            })*/
          } else {
            unsupportedHttpMethod(res)
          }
        } else {
          var feedId = parts.shift()
          if(parts.length === 0) {
            // Feed. Supported methods: GET, PUT, DELETE
            if(method === "GET") {

            } else if(method === "PUT") {

            } else if(method === "DELETE") {

            } else {
              unsupportHttpMethod(res)
            }
          } else if(parts.shift() === "articles") {
            if(parts.length === 0) {
              // Articles. Supported methods: GET
              if(method === "GET") {
                completeRequest(this._store.query(function(item) { return item.source === feedId }))
              } else {
                unsupportedHttpMethod(res)
              }
            } else {
              var articleId = parts.shift()
              if(parts.length === 0) {
                // Article. Supported methods: GET, PUT, DELETE
                if(method === "GET") {

                } else if(method === "PUT") {

                } else if(method === "DELETE") {

                } else {
                  unsupportedHttpMethod(res)
                }
              } else if(parts[0] === "content") {

              } else {
                dataNotFound(res)
              }
            }
          } else {
            dataNotFound(res)
          }
        }
      } else {
        dataNotFound(res)
      }
    }
  })
})

/*
Feeds
    C POST /feeds
    R GET /feeds or GET /feeds/UUID
    U PUT /feeds/UUID
    D DELETE /feeds/UUID

Articles
    C n/a
    R /feeds/UUID/articles or /feeds/UUID/articles/UUID
    U /feeds/UUID/articles/UUID
    D /feeds/UUID/articles/UUID
*/