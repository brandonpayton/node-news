define([
    "dojo/_base/declare"
    /*=====, "dojo/store/api/Store" =====*/
], function(declare /*=====, Store =====*/) {

    // No base class, but for purposes of documentation, the base class is dojo/store/api/Store
    var base = null;
    /*===== base = Store =====*/

    return declare(base, {
        getIdentity: function(article) {
            // summary:
            //      Returns the article's identity.
            // article: Article
            //      The article to get the identity from
            // returns: String
            return this._serializeIdentity(article);
        },

        // TODO: Test identity serialization
        _serializeIdentity: function(article) {
            if(!article.feedUrl) {
                throw new Error("Article is missing a feedUrl property.");
            } else if(!article.guid) {
                throw new Error("Article is missing a guid property.");
            }

            return encodeURIComponent(article.feedUrl) + " " + encodeURIComponent(article.guid);
        },
        _deserializeIdentity: function(id) {
            var parts = id.split(" ");
            if(parts.length !== 2) {
                throw new Error("Invalid article identity.");
            }

            return {
                feedUrl: decodeURIComponent(parts[0]),
                guid: decodeURIComponent(parts[1])
            };
        },

        get: function(id){
            return this._get(this._deserializeIdentity(id));
        },

        _get: function(feedUrl, guid) {
            throwAbstract();
        }
    });

    function throwAbstract() { throw new Error("Not implemented."); }
});
