define([
	"dojo/_base/declare",
	"dojo/request",
	"dojo/store/util/QueryResults",
	"core/_ArticleStoreBase"
], function(declare, request, QueryResults, _ArticleStoreBase) {

	function convertDataToArticle(/* object */ articleData) {
		// summary:
		//		Converts article data to a proper article object.
		// articleData: Object
		//		Raw article data object
		// returns: Article
		//		The converted Article
		// 
		articleData.date = new Date(articleData.date);
		return articleData;
	}

	return declare(_ArticleStoreBase, {
		// summary:
		//		A store for RSS/Atom articles.

		// dataUrl: String
		//		The root URL of the news aggregator API.
		dataUrl: null,

		constructor: function(args) {
			// summary:
			//		Create the store.
			// args: Object
			//		Object hash containing a dataUrl property.
			declare.safeMixin(this, args);
		},

		// TODO: Look for a convention for documenting returned promises. I don't want to lose the fact that this is a promise or the type of the resolved value.
		get: function(id) {
			// summary:
			//		Retrieves an Article by its identity.
			// id: String
			//		The Article identity.
			// returns: dojo/promise/Promise
			//		A promise to retrieve the Article.
			return request(this._getArticleUrl(id), { handleAs: "json" }).then(convertDataToArticle);
		},

		put: function(article, options) {
			// summary:
			//		Stores an Article
			// article: Article
			//		The Article to store.
			// options: Object
			//		No options are currently supported.
			// returns: string
			//		The identity of the Article that was stored.

			var articleUrl = this._getArticleUrl(this.getIdentity(article));
			return request.put(articleUrl, {
				headers: {
					"Content-Type": "application/json"
				},
				data: JSON.stringify(article),
				handleAs: "json"
			});
		},

		query: function(query, options) {
			// summary:
			//		Queries for Article objects.
			// query: Object
			//		The query for retrieving Article's from the store.
			// options: Object
			//		Currently ignored but may later be used to allow requesting ranges of articles.
			// returns: Store.QueryResults

			var queryUrl = this.dataUrl;
			if(query.feedUrl !== undefined) {
				queryUrl += "/feed/" + encodeURIComponent(query.feedUrl) + "/articles";
			} else if(query.tag !== undefined) {
				queryUrl += "/tag/" + query.tag + "/articles";
			} else {
				throw new Error("Unsupported article query.");
			}
			
			var asyncResults = request(queryUrl, {
				handleAs: "json"
			}).then(function(results) {
				return results.map(convertDataToArticle);
			});
			return QueryResults(asyncResults);
		},

		_getArticleUrl: function(articleId) {
			return this.dataUrl + "/article/" + encodeURIComponent(articleId);
		}
	});
});
