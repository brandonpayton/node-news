define(function() {
    return function sofaCallback(deferred) {
        return function() {
            var res = arguments[arguments.length - 1];
            if(res.error) deferred.reject(new Error(res.error + ": " + res.reason));
            else deferred.resolve(res);
        };
    }
});

