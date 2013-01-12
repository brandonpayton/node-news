define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/Deferred",
    "dojo/store/util/QueryResults"
], function(declare, lang, Deferred, QueryResults) {

    // TODO: Instead of mapping naming conventions from app to db, it would be simpler to follow the same naming conventions for both. Prefer the app's convention.
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

    var ArticleStore = declare(null, {
        _postgresClient: null,
        _feedUrl: null,

        getIdentity: function(obj) {
            return obj.id;
        },

        constructor: function(postgresClient, feedUrl) {
            this._postgresClient = postgresClient;
            this._feedUrl = feedUrl;
        },

        add: function(articleData) {
            var article = {
                type: "article",
                feedUrl: this._feedUrl
            };
            return this.put(lang.mixin(article, articleData));
        },

        put: function(article) {
            var articleRow = articleToRow(article);

            var paramSpecs = [],
                paramValues = [];

            Object.keys(articleRow).forEach(function(paramName, i) {
                var paramValue = articleRow[paramName];
                paramSpecs.push(paramName + " := $" + (paramSpecs.length + 1));
                paramValues.push(paramValue);
            });
            return this._postgresClient.query(
                "SELECT save_article(" + paramSpecs.join(",") + ")",
                paramValues
            );
        },

        get: function(id) {
            var resultPromise = this._postgresClient.query(
                "SELECT * FROM get_article(id := $1);",
                [ id ]
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

        query: function() {
            var resultPromise = this._postgresClient.query(
                "SELECT * FROM get_articles_by_feed(url := $1);",
                [ this._feedUrl ]
            );

            return QueryResults(resultPromise.then(function(result) {
                return result.map(rowToArticle);
            }));
        }
    });

    ArticleStore.rowToArticle = rowToArticle;
    ArticleStore.articleToRow = articleToRow;

    return ArticleStore;
});
