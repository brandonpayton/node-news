define([
	"server/store/ArticleStore",
	"doh/main",
	"dojo/_base/lang",
	"dojo/Deferred"
], function(ArticleStore, doh, lang, Deferred) {
	
	function createPostgresClientMock(queryFunction) {
		return {
			query: function() {
				var dfd = new Deferred();
				try {
					var args = Array.prototype.slice.call(arguments);
					dfd.resolve(queryFunction.apply(null, args));
				} catch(e) {
					dfd.reject(e);
				}
				return dfd;
			}
		}
	}

	doh.register("ArticleStore", [
		function getIdentity(t) {
			var store = new ArticleStore();
			var mockArticle = { feedUrl: "mockUrl", guid: "mockGuid" };
			t.assertEqual(mockArticle.feedUrl + " " + mockArticle.guid, store.getIdentity(mockArticle));
		},
		function getExisting(t) {
			var dfd = new doh.Deferred();
			var expectedArticle = {
				feedUrl: "http://test.me/feed",
				guid: "abz"
			};
			var postgresClientMock = createPostgresClientMock(function(query, params) {
				t.assertEqual(2, params.length);
				t.assertEqual(expectedArticle.feedUrl, params[0]);
				t.assertEqual(expectedArticle.guid, params[1]);
				return {
					rows: [
						{ feed_url: expectedArticle.feedUrl, guid: expectedArticle.guid }
					]
				};
			});
			var store = new ArticleStore(postgresClientMock);
			store.get(store.getIdentity(expectedArticle)).then(dfd.getTestCallback(function(actualArticle) {
				Object.keys(expectedArticle).forEach(function(key) {
					t.assertEqual(expectedArticle[key], actualArticle[key]);
				});
			}, lang.hitch(dfd, "errback")));

			return dfd;
		},
		function getNonExisting(t) {
			var dfd = new doh.Deferred();
			var postgresClientMock = createPostgresClientMock(function() {
				return { rows: [ ] };
			});
			var store = new ArticleStore(postgresClientMock);
			store.get("FEEDURL GUID").then(dfd.getTestCallback(function(article) {
				t.assertEqual(undefined, article);
			}), lang.hitch(dfd, "errback"));
			return dfd;
		},
		function getTooMany(t) {
			var dfd = new doh.Deferred();
			var postgresClientMock = createPostgresClientMock(function() {
				return { rows: [ {}, {} ] }
			});
			var store = new ArticleStore(postgresClientMock);
			store.get("FEEDURL GUID").then(
				function() {
					dfd.errback(new Error("Expected error but none was encountered."));
				},
				// TODO: Change store to return specialized error type and verify that here.
				dfd.getTestCallback(function(expectedError) {
					t.assertTrue(expectedError instanceof Error);
				})
			);
			return dfd;
		},
		// add() utilizes put(), so only verify that add() adds the type and feedUrl and that it does in fact call put().
		function add(t) {
			var articleToAdd = {
				title: "Article to Add"
			};
			var expectedFeedUrl = "http://test.me/feed";
			var expectedArgumentToPut = lang.mixin({
				type: "article",
				feedUrl: expectedFeedUrl
			}, articleToAdd);

			var postgresClientMock = null;
			var store = new ArticleStore(postgresClientMock, expectedFeedUrl);
			store.put = function(actualArgument) {
				Object.keys(expectedArgumentToPut).forEach(function(key) {
					t.assertEqual(expectedArgumentToPut[key], actualArgument[key]);
				});
			};
		},
		function put(t) {
			var dfd = new doh.Deferred();
			var expectedFeedUrl = "http://test.me/feed";
			var articleToPut = {
				type: "article",
				feedUrl: expectedFeedUrl,
				title: "Article to Put"
			};
			var expectedArticleRow = {
				type: articleToPut.type,
				feed_url: articleToPut.feedUrl,
				title: articleToPut.title
			};
			var postgresClientMock = createPostgresClientMock(function(query, params) {
				var matchedParamExpressions = query.match(/\w+ := \$\d+/g);

				t.assertNotEqual(null, matchedParamExpressions);
				t.assertEqual(matchedParamExpressions.length, params.length);
				t.assertEqual(Object.keys(expectedArticleRow).length, matchedParamExpressions.length);

				matchedParamExpressions.forEach(function(paramExpression, i) {
					var name = paramExpression.split(" := ")[0];
					t.assertEqual(expectedArticleRow[name], params[i]);
				});
			});

			var store = new ArticleStore(postgresClientMock, expectedFeedUrl);
			store.put(articleToPut).then(dfd.getTestCallback(function() {
				// Do nothing.
			}), lang.hitch(dfd, "errback"));
		},
		function query_feedUrl(t) {
			var dfd = new doh.Deferred();

			var expectedFeedUrl = "http://test.me/feed";
			var expectedRows = [
				{
					feedUrl: expectedFeedUrl,
					guid: 123,
					title: "First Title"
				},
				{
					feedUrl: expectedFeedUrl,
					guid: 456,
					title: "Second Title"
				}
			];
			var postgresClientMock = createPostgresClientMock(function(query, params) {
				t.assertEqual(1, params.length);
				t.assertEqual(expectedFeedUrl, params[0]);

				return {
					rows: [
						{
							feed_url: expectedRows[0].feedUrl,
							guid: expectedRows[0].guid,
							title: expectedRows[0].title
						},
						{
							feed_url: expectedRows[1].feedUrl,
							guid: expectedRows[1].guid,
							title: expectedRows[1].title
						}
					]
				};
			});

			var store = new ArticleStore(postgresClientMock, expectedFeedUrl);
			store.query({ feedUrl: expectedFeedUrl }).then(dfd.getTestCallback(function() {
				// Do nothing.
			}), lang.hitch(dfd, "errback"));

			return dfd;
		},
		function query_tag(t) {
			var dfd = new doh.Deferred();

			var expectedTag = "you're it";
			var expectedRows = [
				{
					id: 123,
					feedUrl: "feedUrl1",
					title: "First Title"
				},
				{
					id: 456,
					feedUrl: "feedUrl2",
					title: "Second Title"
				}
			];
			var postgresClientMock = createPostgresClientMock(function(query, params) {
				t.assertEqual(1, params.length);
				t.assertEqual(expectedTag, params[0]);

				return {
					rows: [
						{
							feed_url: expectedRows[0].feedUrl,
							guid: expectedRows[0].guid,
							title: expectedRows[0].title
						},
						{
							feed_url: expectedRows[1].feedUrl,
							guid: expectedRows[1].guid,
							title: expectedRows[1].title
						}
					]
				};
			});

			var store = new ArticleStore(postgresClientMock);
			store.query({ tag: expectedTag }).then(dfd.getTestCallback(function() {
				// Do nothing.
			}), lang.hitch(dfd, "errback"));

			return dfd;
		}
	]);
});
