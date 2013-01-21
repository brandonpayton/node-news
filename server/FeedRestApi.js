define([
    "dojo/_base/lang",
    "dojo/_base/declare",
    "dojo/node!stream",
    "dojo/Deferred",
    "dojo/when",
    "dojo/promise/all",
    "dojo/node!http",
    "dojo/node!url"
], function(lang, declare, Stream, Deferred, when, all, http, url) {

    var successStatusCodes = {
        GET: 200,
        PUT: 201,
        POST: 200,
        DELETE: 204
    };

    function sendData(res, data) {
        if(typeof data === "string") {
            res.setHeader('Content-Type', "text/plain");
            res.end(data);
        } else {
            res.setHeader('Content-Type', "application/json")
            res.end(JSON.stringify(data))
        }
    }

    function serveResource(httpMethod, res, data) {
        res.statusCode = successStatusCodes[httpMethod];
        sendData(res, data);
    }

    function serveError(res, err) {
        err = err || {};

        res.statusCode = err.statusCode || 500;
        sendData(res, {
            type: "error",
            category: err.category || "general",
            message: err.message || http.STATUS_CODES[statusCode]
        });
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

    function HttpError(statusCode, error) {
        var error = error || {};

        this.statusCode = statusCode;
        this.message = typeof error === "string" ?
            error : 
            (error.message || http.STATUS_CODES[statusCode]);
    };
    HttpError.prototype = new Error();
    HttpError.prototype.category = "http";

    function createRequestHandlers(feedStore, feedUpdater) {
        return {
            feeds: {
                "GET": function() {
                    return feedStore.query({
                        includeTags: true,
                        includeTaglessFeeds: true
                    });
                },
                "POST": function(data) {
                    if(!data.url) {
                        throw new HttpError(400, "No url specified for new feed");
                    }
                   
                    return feedUpdater.addFeed({
                        url: data.url,
                        tags: data.tags || []
                    });
                }
            },
            tag: {
                feeds: {
                    "GET": function(tagName) {
                        return feedStore.query({ tag: tagName });
                    }
                },
                articles: {
                    "GET": function(tagName) {
                        return feedStore.getArticlesForTag(tagName);
                    }
                }
            },
            feed: {
                "GET": function(feedId) {
                    return feedStore.get(feedId);
                },
                "PUT": function(feedId, data) {
                    if(data.url !== feedId) {
                        throw new HttpError(400);
                    }
                    return feedStore.put(data);
                },
                "DELETE": function(feedId) {
                    return feedStore.remove(feedId);
                },
                articles: {
                    "GET": function(feedId) {
                        return feedStore.getArticleStore(feedId).query();
                    }
                },
                article: {
                    "GET": function(feedId, articleId) {
                        return feedStore.getArticleStore(feedId).get(articleId);
                    },
                    "PUT": function(feedId, articleId, data) {
                        articleId = +articleId;

                        // TODO: Not checking for matching feed URLs now with the idea that the ArticleStore might need to stand on it's own appart from the FeedStore. Consider this.
                        if(data.id !== articleId) {
                            throw new HttpError(400);
                        }
                        return feedStore.getArticleStore(feedId).put(data);
                    }
                }
            }
        };
    };

    return declare([], {
        _requestHandlers: null,
        _rootApiPath: null,
        constructor: function(rootApiPath, feedStore, feedUpdater) {
            this._rootApiPath = rootApiPath;
            this._requestHandlers = createRequestHandlers(feedStore, feedUpdater);
        },
        isApiPath: function(path) {
            return path.indexOf(this._rootApiPath) === 0;
        },
        serve: function(req, res) {
            var handlers = this._requestHandlers;

            try {
                var parseQuery = true;
                var u = url.parse(req.url, parseQuery);

                // Remove ancestor portions of API path.
                var dataPath = u.pathname.substr(this._rootApiPath.length);

                // Remove leading and trailing slashes
                dataPath = dataPath.replace(/^\//, "").replace(/\/$/, "")

                var parts = dataPath.split("/")

                // No part may be empty.
                if(parts.some(function(part) { return part === "" })) {
                    throw new HttpError(404);
                }
                console.log(parts);
                var method = req.method;

                var context = null;
                var handlerParams = [ ];
                var handlerContext = null;
                while(parts.length > 0) {
                    var contextName = parts.shift(), contextId;
                    handlerContext = (handlerContext || handlers)[contextName];

                    if(parts.length > 0) {
                        contextId = decodeURIComponent(parts.shift());
                        handlerParams.push(contextId);
                    }
                }

                if(!handlerContext) {
                    throw new HttpError(405);
                } else {
                    var handler = handlerContext[method];
                    if(!handler) {
                        throw new HttpError(405);
                    } else {
                        //
                        // TODO: Simplify deferred chaining in this block, especially error handling.
                        // 

                        function completeResponse(dataOrPromise) {
                            return when(dataOrPromise, function(data) {
                                if(method === "GET" && data === undefined) {
                                    serveError(res, new HttpError(404));
                                } else {
                                    serveResource(method, res, data)
                                }
                            }, function(err) {
                                serveError(res, err);
                            })
                        }

                        var result = null;
                        if(method in { PUT: 1, POST: 1 }) {
                            if(req.headers["content-type"] !== "application/json") {
                                throw new HttpError(415, "Content-type must be application/json");
                            }
                            readAllData(req).then(function(data) {
                                handlerParams.push(JSON.parse(data));
                                return handler.apply(null, handlerParams);
                            }).then(function(result) {
                                completeResponse(result);
                            }, function(err) {
                                serveError(res, err);
                            });
                        } else {
                            completeResponse(handler.apply(null, handlerParams));
                        }
                    }
                }
            } catch(err) {
                serveError(res, err);
            }
        }
    });
});
