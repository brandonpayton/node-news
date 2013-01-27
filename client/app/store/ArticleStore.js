define([
    "dojo/_base/declare",
    "dojo/request",
    "dojo/store/util/QueryResults"
    /*===== , "dojo/store/api/Store" =====*/
], function(declare, request, QueryResults /*=====, Store =====*/) {

    // No base class, but for purposes of documentation, the base class is dojo/store/api/Store
    var base = null;
    /*===== base = Store =====*/

    // TODO: This was taken as an example from the gfx Point documentation which included an assignment to g.Point. Does this declare need assigned to something?
    /*=====
    declare("client/store/Article", null, {
		// summary:
		//		Article from RSS/Atom feed.
		// description:
		//		There is no constructor for an Article. This is where the form of an Article is documented.

        // feedUrl: string
        //      The URL of the feed from whence this article came.
        feedUrl: null,

        // guid: string
        //      A unique article identifier for the parent Feed. Not necessarily a UUID, just something unique for the Feed.
        guid: null,

        // date: Date
        //      The last modified date
        date: null,

        // link: string
        //      The URL of the original article
        link: null,

        // author: string
        //      The author of the article
        author: null,

        // title: string
        //      The title of the article
        title: null,

        // summary: string
        //      The article summary
        summary: null,

        // description: string
        //      The article content
        description: null,
        
        // read: Boolean
        //      Whether the Article has been read
        read: null,

        // id: Number
        //      The Article identifier
        id: null
	});
    =====*/

    function convertDataToArticle(/* object */ articleData) {
        // summary:
        //      Converts article data to a proper article object.
        // articleData: Object
        //      Raw article data object
        // returns: Article
        //      The converted Article
        // 
        articleData.date = new Date(articleData.date);
        return articleData;
    }

    return declare(base, {
        // summary:
        //      A store for RSS/Atom articles.

        // dataUrl: String
        //      The root URL of the news aggregator API.
        dataUrl: null,

        constructor: function(args) {
            // summary:
            //      Create the store.
            // args: Object
            //      Object hash containing a dataUrl property.
            declare.safeMixin(this, args);
        },

        // TODO: Is there a way with dojodoc to specify "inherit documentation"?
        getIdentity: function(article) {
            // summary:
            //      Returns an article's identity.
            // article: Article
            //      The Article to get the identity from
            // returns: Number
            //      The Article identity
            return article.id;
        },

        // TODO: Look for a convention for documenting returned promises. I don't want to lose the fact that this is a promise or the type of the resolved value.
        // TODO: Migrate articles to use composite Primary Key (feedUrl+guid). Currently, this store is broken.
        get: function(id) {
            // summary:
            //      Retrieves an Article by its identity.
            // id: String
            //      The Article identity.
            // returns: dojo/promise/Promise
            //      A promise to retrieve the Article.
            return request(this._getArticleUrl(id), {
                handleAs: "json"
            }).then(convertDataToArticle);
        },

        put: function(article, options) {
            // summary:
            //      Stores an Article
            // article: Article
            //      The Article to store.
            // options: Object
            //      No options are currently supported.
            // returns: string
            //      The identity of the Article that was stored.

            // TODO: Restore this line after migrating from int primary key to (feedUrl+guid)
            //var articleUrl = this._getArticleUrl(this.getIdentity(article));
            var articleUrl = this.dataUrl +
                "/feed/" + encodeURIComponent(article.feedUrl) +
                "/article/" + encodeURIComponent(this.getIdentity(article));

            return request.put(articleUrl, {
                headers: {
                    // DOJO TODO: File bug about case-sensitive Content-Type header. If the casing isn't like this, then the default content type overrides ours.
                    "Content-Type": "application/json"
                },
                data: JSON.stringify(article),
                handleAs: "json"
            });
        },

        query: function(query, options) {
            // summary:
            //      Queries for Article objects.
            // query: Object
            //      The query for retrieving Article's from the store.
            // options: Object
            //      Currently ignored but may later be used to allow requesting ranges of articles.
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
        }
        // TODO: Resume using this after converting to feedUrl+guid primary key.
        /*
        _getArticleUrl: function(feedUrl, guid) {
            return this.dataUrl +
                "/feed/" + encodeURIComponent(article.feedUrl) +
                "/article/" + encodeURIComponent(guid);
        }
        */
    });
});
