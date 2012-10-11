// TODO: Create AMD loader plugin to wait until database is loaded and model created.
define([
    "dojo/Deferred",
    "dojo/node!alfred"
], function(Deferred, alfred) {
    var async = new Deferred();
    // TODO: Make use of path parameter.
    
    debugger;
    alfred.open("news.adb", function(err, db) {
        if(err) {
            async.reject(err);     
        } else {
            var FeedOrGroup = db.define("FeedOrGroup");
            [
                [ "groupId", "string", { optional: true } ]
                [ "type", "string", { enum: [ "group", "feed" ] }],
                [ "name", "string", { minLength: 1 }],
                // TODO: Add URL validation.
                [ "url", "string", {
                    minLength: "http://".length + 1,
                    // TODO: Test this.
                    validateWith: function(doc) {
                        return doc.type === "feed" || doc.url === undefined;                
                    }
                }]
            ].forEach(function(propDef) {
                FeedOrGroup.apply(FeedOrGroup, propDef);
            });
            FeedOrGroup.index("groupId", function(o) { return o.groupId || null; });
            FeedOrGroup.index("type", function(o) { return o.type; });
            
            var Article = db.define("Article");
            [
                "feedId",
                "author",
                "date",
                "title",
                "description",
                "link",
                "guid",        
                "categories",
                "unread"
            ].forEach(Article.property.bind(Article));
            Article.index("date", function(article) { return article.date; });
            Article.index("author", function(article) { return article.author; });
            Article.index("title", function(title) { return article.title; });
            
            async.resolve({
                FeedOrGroup: fog,
                Article: Article
            });
        }
    });
    return async;
});
