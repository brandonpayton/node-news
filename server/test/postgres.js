define([
	"../postgres",
	"doh/main",
	"dojo/_base/lang",
	"dojo/string",
	"dojo/text!server/data/create.sql"
], function(postgres, doh, lang, dojoString, creationSql) {
	doh.register("postgres", [
		{
			name: "createClient",
			_client: null,
			runTest: function(t) {
				var dfd = new doh.Deferred();
				var self = this;

				postgres.createClient("tcp://localhost/postgres").then(
					dfd.getTestCallback(function(client) {
						self._client = client;
						t.isNot(undefined, client);
					}),
					lang.hitch(dfd, "errback")
				);

				return dfd;
			},
			tearDown: function() {
				this._client.end();
			}
		},
		{
			name: "client query",
			runTest: function(t) {
				var dfd = new doh.Deferred();
				var self = this;

				postgres.createClient("tcp://localhost/postgres").then(function(client) {
					self._client = client;
					client.query("SELECT 123 AS value;").then(dfd.getTestCallback(function(result) {
						t.assertEqual(1, result.rows.length);
						t.assertEqual(123, result.rows[0].value);
					}), lang.hitch(dfd, "errback"))
				});
				
				return dfd;
			},
			tearDown: function() {
				this._client.end();
			}
		}
	]);
});
