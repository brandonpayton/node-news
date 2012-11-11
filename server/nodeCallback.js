define(function() {
    return function nodeCallback(deferred) {
        return function(err, doc) {
            // OPP: VIM: INDENT: else is indented if semicolon doesn't terminate if body
            if(err) deferred.reject(err);
            else deferred.resolve(doc);
        };
    }
});

