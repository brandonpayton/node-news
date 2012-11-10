define([
    "dojo/_base/lang",
    "dojo/_base/declare",
    "dojo/node!stream",
    "dojo/Deferred",
    "dojo/when",
    "dojo/promise/all",
    "dojo/node!http",
    "dojo/node!url",
    "lib/updateFeed"
], function(lang, declare, Stream, Deferred, when, all, http, url, updateFeed) {

    function error(res, statusCode, err) {
        res.statusCode = statusCode;
        res.end(http.STATUS_CODES[statusCode] + "\n" + err.toString());   
    }

    function deferredErrorCallback(err) {
        
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

    function completeResponse(res, dataPromise) {
        return when(dataPromise, function(data) {
            serveJson(res, data)
        }, function(err) {
            error(res, 500, err)
        })
    }

    function createRequestHandlers(feedStore) {
        return {
            feeds: {
                "GET": function() {
                    return feedStore.query();
                },
                "POST": function(data) {
                    var data = JSON.parse(data),
                        url = data.url;

                    if(!url) {
                        throw new Error("No url specified for new feed");
                    }
                    
                    return feedStore.query({ key: data.url }).then(function(results) {
                        if(results.length > 0) {
                            throw new Error("Feed already exists.");
                        }

                        var asyncFeed = new Deferred(),
                            feedPromise = null;

                        function fulfilledCallback() {
                            if(feedPromise === null) {
                                asyncFeed.reject(new Error("Unable to populate feed data."));
                            }
                        }
                        function progressCallback(progress) {
                            if(progress.type === "SavingFeed") {
                                feedPromise = progress.promise;
                                feedPromise.then(lang.hitch(asyncFeed, "resolve"), lang.hitch(asyncFeed, "reject"));
                            }
                        }
                        updateFeed(feedStore, url).then(fulfilledCallback, fulfilledCallback, progressCallback);
                        return asyncFeed;
                    });
                }
            },
            feed: {
                "GET": function(feedId) {
                    return feedStore.get(feedId);
                },
                "DELETE": function(feedId) {
                    return feedStore.remove(feedId);
                }
            },
            articles: {
                "GET": function(feedId) {
                    return feedStore.getArticleStore(feedId).query();
                }
            },
            article: {
                "PUT": function(feedId, articleId, data) {
                    data = lang.mixin({ _id: articleId }, data);
                    return feedStore.getArticleStore(feedId).put(data);
                },
                "DELETE": function(feedId, articleId) {
                    return feedStore.getArticleStore(feedId).remove(articleId);
                }
            }
        };
    };

    return declare([], {
        _requestHandlers: null,
        constructor: function(feedStore) {
            this._requestHandlers = createRequestHandlers(feedStore);
        },
        serve: function(dataPath, req, res) {
            var handlers = this._requestHandlers;
            function errorCallback(err) { error(res, 500, err); }

            try {
                var parseQuery = true;
                var u = url.parse(req.url, parseQuery);

                // Remove leading and trailing slashes
                var dataPath = dataPath.replace(/^\//, "").replace(/\/$/, "")
                var parts = dataPath.split("/")

                // No part may be empty.
                if(parts.some(function(part) { return part === "" })) {
                    dataNotFound()
                }
                console.log(parts);
                var method = req.method;

                var context = null;
                var handlerParams = [ ];
                while(parts.length > 0) {
                    var context = parts.shift(), contextId;
                    if(parts.length > 0) {
                        contextId = parts.shift();
                        handlerParams.push(contextId);
                    }
                }

                var handler = handlers[context][method];
                if(!handler) {
                    unsupportedHttpMethod(res);
                } else {
                    var result = null;
                    if(method in { PUT: 1, POST: 1 }) {
                        readAllData(req).then(function(data) {
                            handlerParams.push(data);
                            completeResponse(res, handler.apply(null, handlerParams));
                        });
                    } else {
                        completeResponse(res, handler.apply(null, handlerParams));
                    }
                }
                /*
                if(parts.shift() === "feeds") {
                    if(parts.length === 0) {
                        handler = handlers.feeds[method];
                    } else {
                        var feedId = parts.shift()
                        if(parts.length === 0) {
                            handler = handlers.feed[method];
                        } else if(parts.shift() === "articles") {
                            if(parts.length === 0) {
                                handler = handlers.articles[method];
                            } else {
                                var articleId = parts.shift()
                                if(parts.length === 0) {
                                    handler = handlers.article[method];
                                } else {
                                    if(parts[0] === "content") {
                                        handler = handlers.content[method];
                                    }
                                } 
                            }
                        }
                    }
                }
                */
            } catch(err) {
                errorCallback(err);
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
