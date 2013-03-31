define([ "dojo/_base/declare" ], function(declare, contract) {
    return declare(null, {
		// summary:
		//		An RSS/Atom feed.

        constructor: function(args) {
            // summary:
            //      Create the Feed.
            // args: Object
            //      An object hash containing the Feed properties.
            
            declare.safeMixin(args);
        },

        // url: String
        //      The URL of the feed
        url: null,

        // name: String
        //      The name of the feed.
        name: null,

        // tags: Array
        //      An array of tags
        tags: null
    });
});
