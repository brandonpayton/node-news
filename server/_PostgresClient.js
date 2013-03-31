define([
	"dojo/_base/declare",
	"dojo/Deferred",
	"./nodeCallback"
], function(declare, Deferred, nodeCallback) {
	return declare(null, {
		_nodePostgresClient: null,

		constructor: function(nodePostgresClient) {
			this._nodePostgresClient = nodePostgresClient;
		},

		query: function() {
			var args = Array.prototype.slice.call(arguments);
			var dfdResult = new Deferred();
			args.push(nodeCallback(dfdResult));
			var client = this._nodePostgresClient;
			client.query.apply(client, args);
			return dfdResult.promise;
		},
		end: function() {
			this._nodePostgresClient.end();
		}
	});
});
