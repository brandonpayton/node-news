define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/Deferred",
	"dojo/store/util/QueryResults",
	"core/_ArticleStoreBase"
], function(declare, lang, Deferred, QueryResults, _ArticleStoreBase) {

	// TODO: Factor out this general jsProperty2column_name mapping logic into another module.
	function rowToArticle(row) {
		var underscoreSeparatedPattern = /([a-z\d])_([a-z\d])/;
		var article = {};
		Object.keys(row).forEach(function(key) {
			var camelCasedName = key.replace(underscoreSeparatedPattern, function(match, p1, p2) {
				return p1 + p2.toUpperCase();
			});
			article[camelCasedName] = row[key];
		});
		return article;
	}
	function articleToRow(article) {
		var camelCasePattern = /([a-z\d])([A-Z])/;
		var row = {}
		Object.keys(article).forEach(function(key) {
			var underscoreSeparatedName = key.replace(camelCasePattern, function(match, p1, p2) {
				return p1 + "_" + p2.toLowerCase();
			});
			row[underscoreSeparatedName] = article[key];
		});
		return row;
	}

	var ArticleStore = declare(_ArticleStoreBase, {
		_postgresClient: null,

		constructor: function(postgresClient) {
			this._postgresClient = postgresClient;
		},

		add: function(articleData) {
			var article = {
				type: "article"
			};
			return this.put(lang.mixin(article, articleData));
		},

		put: function(article) {
			var paramSpecs = [],
				paramValues = [];

			var articleRow = articleToRow(article);
			Object.keys(articleRow).forEach(function(paramName, i) {
				// Skip the type
				if(paramName === 'type') return;

				var paramValue = articleRow[paramName];
				paramSpecs.push(paramName + " := $" + (paramSpecs.length + 1));
				paramValues.push(paramValue);
			});

			return this._postgresClient.query(
				"SELECT * FROM news.save_article(" + paramSpecs.join(",") + ");",
				paramValues
			).then(function(result) {
				// Ignore result 
			});
		},

		get: function(id) {
			var compoundId = this._deserializeIdentity(id);

			var resultPromise = this._postgresClient.query(
				"SELECT * FROM news.get_article(feed_url := $1, guid := $2);",
				[ compoundId.feedUrl, compoundId.guid ]
			);
			return resultPromise.then(function(result) {
				var rows = result.rows;
				if(rows.length === 1) {
					return rowToArticle(rows[0]);
				} else if(rows.length === 0) {
					return undefined;
				} else {
					throw new Error("Retrieved more than one result for id: '" + id + "'");
				}
			});
		},

		query: function(query) {
			var resultPromise;
			if(query) {
				if(query.feedUrl !== undefined) {
					resultPromise = this._postgresClient.query(
						"SELECT * FROM news.get_articles_for_feed(feed_url := $1);",
						[ query.feedUrl ]
					);
				} else if(query.tag !== undefined) {
					resultPromise = this._postgresClient.query(
						"SELECT * FROM news.get_articles_for_tag(tag := $1);",
						[ query.tag ]
					);
				} else {
					throw new Error("Unsupported query.");
				}
			} else {
				throw new Error("Unsupported query.");
			}

			return QueryResults(resultPromise.then(function(result) {
				return result.rows.map(rowToArticle);
			}));
		},

		exists: function(article) {
			// TODO: Write test for this.
			// TODO: Convert this to postgres function
			return this._postgresClient.query(
				"SELECT COUNT(*) FROM news.typed_article WHERE feed_url = $1 AND guid = $2;",
				[ article.feedUrl, article.guid ]
			).then(function(result) {
				return result.rows[0].count > 0;
			});
		},

		getArticlesForTag: function(tag) {
		}
	});

	ArticleStore.rowToArticle = rowToArticle;
	ArticleStore.articleToRow = articleToRow;

	return ArticleStore;
});
