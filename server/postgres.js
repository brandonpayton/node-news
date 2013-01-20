define([
    "dojo/node!pg",
    "dojo/node!child_process",
    "dojo/Deferred",
    "./_PostgresClient"
], function(pg, child_process, Deferred, _PostgresClient) {
    var spawn = child_process.spawn;

    return {
        createClient: function(connectionString) {
            var dfdConnection = new Deferred();

            // Using pg.Client instead of pg.connect to avoid connection pooling since only a single connection is used.
            var client = new pg.Client(connectionString);
            client.connect(function(err) {
                if(err) {
                    dfdConnection.reject(err);
                } else {
                    // TODO: Separate this object into its own module.
                    dfdConnection.resolve(new _PostgresClient(client));
                }
            });

            return dfdConnection.promise;
        }
    };
})
