define([ "dojo/_base/lang" ], function(lang) {
    return {
        // summary:
        //      AMD loader plugin for JSON

        load: function(id, require, load) {
            // summary:
            //      The function that is called to load a resource.
            require([ "dojo/text!" + id ], function(jsonText) {
                try {
                    load(JSON.parse(jsonText));
                } catch(err) {
                    require.signal("error", lang.mixin(err, { src: "jsonLoader" }));
                }
            });
        }
    }
});
