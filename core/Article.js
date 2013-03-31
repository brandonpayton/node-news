define([ "dojo/_base/declare" ], function(declare) {
    return declare(null, {
		// summary:
		//		Article from RSS/Atom feed.
        
        constructor: function(args) {
            // summary: 
            //      Create the Article
            // args: Object
            //      An object hash containing the article properties.

            declare.safeMixin(args);
        },

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
        read: null
	});
});
