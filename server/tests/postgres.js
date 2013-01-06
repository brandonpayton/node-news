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
                this._client && this._client.end();
            }
        },
        function runPsqlScript(t) {
            var databaseName = "news_test_postgres";
            var testCommands = dojoString.substitute(creationSql, { database_name: databaseName });
            testCommands += "\nDROP DATABASE " + databaseName + ";";

            var dfd = new doh.Deferred();
            postgres.runPsqlScript(testCommands).then(
                dfd.getTestCallback(function() {
                    // Do nothing.
                }),
                lang.hitch(dfd, "errback"),
                function(output) {
                    if(output.type === "stdout") {
                        process.stdin.write(output.data);
                    } else if(info.type === "stderr") {
                        process.stderr.write(output.data);
                    }
                }
            );
            return dfd;
        }
    ]);
});
