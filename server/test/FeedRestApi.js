define([
	"server/FeedRestApi",
	"doh/main",
	"dojo/node!node-mocks-http",
	"dojo/node!events",
	"dojo/_base/lang",
	"dojo/aspect",
	"dojo/Deferred"
], function(FeedRestApi, doh, httpMocks, nodeEvents, lang, aspect, Deferred) {

	function proxyMethod(methodName, from, to) {
		from[methodName] = function() {
			var args = Array.prototype.slice.call(arguments);
			return to[methodName].apply(to, args);
		}
	}
	function createHttpRequestMock(options) {
		var mockRequest = httpMocks.createRequest(options),
			eventEmitter = new nodeEvents.EventEmitter();

		proxyMethod("on", mockRequest, eventEmitter);
		proxyMethod("emit", mockRequest, eventEmitter);

		mockRequest.setEncoding = function() {}

		return mockRequest;
	}
	function createHttpResponseMock() {
		var mockResponse = httpMocks.createResponse();

		var dfdEnding = new Deferred();
		mockResponse.promiseToEnd = dfdEnding.promise;
		aspect.after(mockResponse, "end", function() {
			dfdEnding.resolve();
		});
		
		return mockResponse;
	}

	doh.register("FeedRestApi", [
		function feeds_GET(t) {
			var expectedResponse = [ { mockResponse: "mockResponse" } ];
			var feedStoreMock = {
				query: function(query) {
					t.assertTrue(query.includeTags);
					t.assertTrue(query.includeTaglessFeeds);
					return expectedResponse;
				}
			};
			var feedUpdaterMock = null;
			var api = new FeedRestApi("/test", feedStoreMock, feedUpdaterMock);
			var req = createHttpRequestMock({
				method: "GET",
				url: "/test/feeds"
			});
			var res = createHttpResponseMock();

			api.serve(req, res);
			t.assertEqual(200, res.statusCode);
			t.assertEqual(expectedResponse, JSON.parse(res._getData()));
		},
		function feeds_POST(t) {
			var dfd = new doh.Deferred();
			var expectedRequestBody = {
				url: "http://test.me/feed",
				tags: [ "abc", "xyz" ]
			};
			var expectedResponse = expectedRequestBody.url;
			var feedStoreMock = {
				add: function(feed) {
					t.assertEqual(expectedRequestBody, feed);
					return expectedResponse;
				}
			};
			var feedUpdaterMock = {
				addFeed: function(feed) { return feed.url; }
			};
			var api = new FeedRestApi("/test", feedStoreMock, feedUpdaterMock);
			var req = createHttpRequestMock({
				method: "POST",
				url: "/test/feeds",
				headers: {
					"content-type": "application/json"
				}
			});
			var res = createHttpResponseMock();

			api.serve(req, res);
			req.emit('data', JSON.stringify(expectedRequestBody));
			req.emit('end');

			res.promiseToEnd.then(
				dfd.getTestCallback(function() {
					t.assertEqual(200, res.statusCode);
					t.assertEqual(expectedResponse, res._getData());
				}),
				lang.hitch(dfd, "errback")
			);

			return dfd;
		},
		function feeds_POST_noUrl(t) {
			var dfd = new doh.Deferred();

			var feedStoreMock = null;
			var feedUpdaterMock = null;
			var api = new FeedRestApi("/test", feedStoreMock, feedUpdaterMock);

			var req = createHttpRequestMock({
				method: "POST",
				url: "/test/feeds",
				headers: {
					"content-type": "application/json"
				}
			});
			var res = createHttpResponseMock();

			api.serve(req, res);

			var requestBodyWithNoUrl = { };
			req.emit('data', JSON.stringify(requestBodyWithNoUrl));
			req.emit('end');

			res.promiseToEnd.then(
				dfd.getTestCallback(function() {
					t.assertEqual(400, res.statusCode);
				}),
				lang.hitch(dfd, "errback")
			);

			return dfd;
		},
		function tag_feeds_GET(t) {
			var expectedResponse = [ { mockResponse: "mockResponse" } ];
			var feedStoreMock = {
				query: function(query) {
					t.assertEqual({ tag: "abc" }, query);
					return expectedResponse;
				}
			};
			var feedUpdaterMock = null;
			var api = new FeedRestApi("/test", feedStoreMock, feedUpdaterMock);
			var req = createHttpRequestMock({
				method: "GET",
				url: "/test/tag/abc/feeds"
			});
			var res = createHttpResponseMock();

			api.serve(req, res);
			t.assertEqual(200, res.statusCode);
			t.assertEqual(expectedResponse, JSON.parse(res._getData()));
		},
		function tag_articles_GET(t) {
			var expectedResponse = [ { mockResponse: "mockResponse" } ];
			var feedStoreMock = {
				getArticlesForTag: function(tag) {
					t.assertEqual("abc", tag);
					return expectedResponse;
				}
			};
			var feedUpdaterMock = null;
			var api = new FeedRestApi("/test", feedStoreMock, feedUpdaterMock);
			var req = createHttpRequestMock({
				method: "GET",
				url: "/test/tag/abc/articles"
			});
			var res = createHttpResponseMock();

			api.serve(req, res);
			t.assertEqual(200, res.statusCode);
			t.assertEqual(expectedResponse, JSON.parse(res._getData()));
		},
		function feed_GET(t) {
			var expectedUrl = "http://test.me";
			var expectedResponse = [ { mockResponse: "mockResponse" } ];

			var feedStoreMock = {
				get: function(feedUrl) {
					t.assertEqual(expectedUrl, feedUrl);
					return expectedResponse;
				}
			};
			var feedUpdaterMock = null;
			var api = new FeedRestApi("/test", feedStoreMock, feedUpdaterMock);
			var req = createHttpRequestMock({
				method: "GET",
				url: "/test/feed/" + encodeURIComponent(expectedUrl)
			});
			var res = createHttpResponseMock();

			api.serve(req, res);
			t.assertEqual(200, res.statusCode);
			t.assertEqual(expectedResponse, JSON.parse(res._getData()));
		},
		function feed_GET_nonExisting(t) {
			var expectedUrl = "http://test.me";

			var feedStoreMock = {
				get: function(feedUrl) {
					t.assertEqual(expectedUrl, feedUrl);
					return undefined;
				}
			};
			var feedUpdaterMock = null;
			var api = new FeedRestApi("/test", feedStoreMock, feedUpdaterMock);
			var req = createHttpRequestMock({
				method: "GET",
				url: "/test/feed/" + encodeURIComponent(expectedUrl)
			});
			var res = createHttpResponseMock();

			api.serve(req, res);
			t.assertEqual(404, res.statusCode);
		},
		function feed_PUT(t) {
			var dfd = new doh.Deferred();

			var expectedUrl = "http://test.me";
			var expectedData = {
				type: "feed",
				url: expectedUrl,
				tags: [ 'abc', 'xyz' ]
			};

			var feedStoreMock = {
				put: function(feed) {
					t.assertEqual(expectedData, feed);
					return feed.url;
				}
			};
			var feedUpdaterMock = null;
			var api = new FeedRestApi("/test", feedStoreMock, feedUpdaterMock);
			var req = createHttpRequestMock({
				method: "PUT",
				url: "/test/feed/" + encodeURIComponent(expectedUrl),
				headers: {
					"content-type": "application/json"
				}
			});
			var res = createHttpResponseMock();

			api.serve(req, res);
			req.emit('data', JSON.stringify(expectedData));
			req.emit('end');

			res.promiseToEnd.then(
				dfd.getTestCallback(function() {
					t.assertEqual(201, res.statusCode);
					t.assertEqual(expectedUrl, res._getData());
				}),
				lang.hitch(dfd, "errback")
			);

			return dfd;
		},
		function feed_PUT_conflictBetweenUrlAndData(t) {
			var dfd = new doh.Deferred();

			var urlForApiPath = "http://test.me";
			var urlInFeedData = "http://different.url";
			var feedData = {
				type: "feed",
				url: urlInFeedData,
				tags: [ 'abc', 'xyz' ]
			};

			var feedStoreMock = null;
			var feedUpdaterMock = null;
			var api = new FeedRestApi("/test", feedStoreMock, feedUpdaterMock);
			var req = createHttpRequestMock({
				method: "PUT",
				url: "/test/feed/" + encodeURIComponent(urlForApiPath),
				headers: {
					"content-type": "application/json"
				}
			});
			var res = createHttpResponseMock();

			api.serve(req, res);
			req.emit('data', JSON.stringify(feedData));
			req.emit('end');

			res.promiseToEnd.then(
				dfd.getTestCallback(function() {
					t.assertEqual(400, res.statusCode);
				}),
				lang.hitch(dfd, "errback")
			);

			return dfd;
		},
		function feed_DELETE(t) {
			var expectedFeedUrl = "http://test.me";
			var feedStoreMock = {
				remove: function(feedUrl) {
					t.assertEqual(expectedFeedUrl, feedUrl);
				}
			};
			var feedUpdaterMock = null;
			var api = new FeedRestApi("/test", feedStoreMock, feedUpdaterMock);
			var req = createHttpRequestMock({
				method: "DELETE",
				url: "/test/feed/" + encodeURIComponent(expectedFeedUrl)
			});
			var res = createHttpResponseMock();

			api.serve(req, res);

			t.assertEqual(204, res.statusCode);
		},
		function feed_articles_GET(t) {
			var expectedFeedUrl = "http://test.me";
			var expectedResponse = [ { mockResponse: "mockResponse" } ];

			var feedStoreMock = null;
			var articleStoreMock = {
				query: function() {
					t.assertEqual(0, arguments.length);
					return expectedResponse;
				}
			};
			var feedUpdaterMock = null;
			var api = new FeedRestApi("/test", feedStoreMock, articleStoreMock, feedUpdaterMock);
			var req = createHttpRequestMock({
				method: "GET",
				url: "/test/feed/" + encodeURIComponent(expectedFeedUrl) + "/articles"
			});
			var res = createHttpResponseMock();

			api.serve(req, res);

			t.assertEqual(200, res.statusCode);
			t.assertEqual(expectedResponse, JSON.parse(res._getData()));
		},
		function feed_article_GET(t) {
			var expectedFeedUrl = "http://test.me";
			var expectedArticleId = 123;
			var expectedResponse = [ { mockResponse: "mockResponse" } ];

			var feedStoreMock = {
				getArticleStore: function(feedUrl) {
					t.assertEqual(expectedFeedUrl, feedUrl);
					return articleStoreMock;
				}
			};
			var articleStoreMock = {
				get: function(actualArticleId) {
					t.assertEqual(expectedArticleId, actualArticleId);
					return expectedResponse;
				}
			};
			var feedUpdaterMock = null;
			var api = new FeedRestApi("/test", feedStoreMock, feedUpdaterMock);
			var req = createHttpRequestMock({
				method: "GET",
				url: "/test/feed/" + encodeURIComponent(expectedFeedUrl) + "/article/" + expectedArticleId
			});
			var res = createHttpResponseMock();

			api.serve(req, res);

			t.assertEqual(200, res.statusCode);
			t.assertEqual(expectedResponse, JSON.parse(res._getData()));
		},
		function feed_article_GET_nonExisting(t) {
			var expectedFeedUrl = "http://test.me";
			var expectedArticleId = 123;
			var expectedResponse = [ { mockResponse: "mockResponse" } ];

			var feedStoreMock = {
				getArticleStore: function(feedUrl) {
					t.assertEqual(expectedFeedUrl, feedUrl);
					return articleStoreMock;
				}
			};
			var articleStoreMock = {
				get: function(actualArticleId) {
					t.assertEqual(expectedArticleId, actualArticleId);
					return undefined;
				}
			};
			var feedUpdaterMock = null;
			var api = new FeedRestApi("/test", feedStoreMock, feedUpdaterMock);
			var req = createHttpRequestMock({
				method: "GET",
				url: "/test/feed/" + encodeURIComponent(expectedFeedUrl) + "/article/" + expectedArticleId
			});
			var res = createHttpResponseMock();

			api.serve(req, res);

			t.assertEqual(404, res.statusCode);
		},
		function feed_article_PUT(t) {
			var dfd = new doh.Deferred();

			var articleStub = {
				type: "article",
				id: 123,
				feedUrl: "http://test.me"
			};

			var feedStoreMock = {
				getArticleStore: function(feedUrl) {
					t.assertEqual(articleStub.feedUrl, feedUrl);
					return articleStoreMock;
				}
			};
			var articleStoreMock = {
				put: function(actualArticleData) {
					t.assertEqual(articleStub, actualArticleData);
					return articleStub.id;
				}
			};
			var feedUpdaterMock = null;
			var api = new FeedRestApi("/test", feedStoreMock, feedUpdaterMock);
			var req = createHttpRequestMock({
				method: "PUT",
				url: "/test/feed/" + encodeURIComponent(articleStub.feedUrl) + "/article/" + articleStub.id,
				headers: {
					"content-type": "application/json"
				}
			});
			var res = createHttpResponseMock();

			api.serve(req, res);
			req.emit('data', JSON.stringify(articleStub));
			req.emit('end');

			res.promiseToEnd.then(
				dfd.getTestCallback(function() {
					t.assertEqual(201, res.statusCode);
					t.assertEqual(articleStub.id, res._getData());
				}),
				lang.hitch(dfd, "errback")
			);

			return dfd;
		},
		function feed_article_PUT_conflictBetweenUrlAndData(t) {
			var dfd = new doh.Deferred();

			var idForApiPath = 123;
			var idInArticleData = 789;
			var articleStub = {
				type: "article",
				id: idInArticleData,
				feedUrl: "http://test.me"
			};

			var feedStoreMock = null;
			var feedUpdaterMock = null;
			var api = new FeedRestApi("/test", feedStoreMock, feedUpdaterMock);
			var req = createHttpRequestMock({
				method: "PUT",
				url: "/test/feed/" + encodeURIComponent(articleStub.feedUrl) + "/article/" + idForApiPath,
				headers: {
					"content-type": "application/json"
				}
			});
			var res = createHttpResponseMock();

			api.serve(req, res);
			req.emit('data', JSON.stringify(articleStub));
			req.emit('end');

			res.promiseToEnd.then(
				dfd.getTestCallback(function() {
					t.assertEqual(400, res.statusCode);
				}),
				lang.hitch(dfd, "errback")
			);

			return dfd;
		},
		function testEnforceJsonContentType(t) {
			var api = new FeedRestApi("/test"),
				req = createHttpRequestMock({
					method: "POST",
					url: "/test/feeds",
					header: {
						"content-type": "text/plain"
					}
				}),
				res = createHttpResponseMock();

			api.serve(req, res);

			t.assertEqual(415, res.statusCode);
		},
		function testErrorJSON(t) {
			var api = new FeedRestApi("/test"),
				req = createHttpRequestMock({
					method: "GET",
					url: "/test/nonExisting"
				}),
				res = createHttpResponseMock();

			api.serve(req, res);

			t.assertEqual(405, res.statusCode);

			var responseData = JSON.parse(res._getData());
			t.assertEqual("error", responseData.type);
			t.assertEqual("http", responseData.category);
		}
	]);
});
