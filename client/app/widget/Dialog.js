define([
    "dojo/_base/declare",
    "dojo/Deferred",
    "dijit/Dialog"
], function(declare, Deferred, Dialog) {
    return declare([ Dialog ], {
        // TODO: Think of better name than asyncResults
        _asyncResults: null,

        show: function() {
            if(!this._asyncResults) {
                _asyncResults = new Deferred();
                function clearAsyncResults() { this._asyncResults = null; }
                _asyncResults.then(clearAsyncResults, clearAsyncResults);
            }

            var asyncShow = new Deferred();
            this.inherited(arguments).then(
                function() { asyncShow.resolve(this._asyncResults); },
                function() { asyncShow.reject(); }
            );
            return asyncShow.promise;
        },

        onCancel: function() {
            this.inherited(arguments);
            _asyncResults.reject();
        },
        onExecute: function() {
            this.inherited(arguments);
            _asyncResults.resolve();
        }
    });
});
