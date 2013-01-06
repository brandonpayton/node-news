define([
    "dojo/node!pg",
    "dojo/node!child_process",
    "dojo/Deferred",
    "./nodeCallback"
], function(pg, child_process, Deferred, nodeCallback) {
    var spawn = child_process.spawn;

    return {
        createClient: function(connectionString) {
            var dfdConnection = new Deferred();

            // Using pg.Client instead of pg.connect to avoid connection pooling that causes unit tests to hang,
            // even after calling pg.end() to dispose of the pools.
            var client = new pg.Client(connectionString);
            client.connect(function(err) {
                if(err) {
                    dfdConnection.reject(err);
                } else {
                    dfdConnection.resolve(client);
                }
            });

            return dfdConnection.promise;
        },
        runPsqlScript: function(scriptStr) {
            var psql = spawn("psql");

            var dfdCompletion = new Deferred();
            psql.stdout.on('data', function (data) {
                dfdCompletion.progress({
                    type: "stdout",
                    data: data
                });
            });

            psql.stderr.on('data', function (data) {
                dfdCompletion.progress({
                    type: "stderr",
                    data: data
                });
            });

            psql.on('exit', function (code) {
                if(code === 0) {
                    dfdCompletion.resolve();
                } else {
                    dfdCompletion.reject(new Error("psql exited with unsuccessful exit code: " + code));
                }
            });

            psql.stdin.end(scriptStr);

            return dfdCompletion.promise;
        }
    };
})
