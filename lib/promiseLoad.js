define([ "dojo/when" ], function(when) {
    return {
        load: function(id, parentRequire, loaded) {
            parentRequire([ id ], function(value) {
                debugger;
                when(value, function(result) {
                    debugger;
                    loaded(result);
                    
                }, function(error) {
                    // TODO: How to report error in loader plugin?
                    console.error(error);    
                });
            });
        }
    };
});