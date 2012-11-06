define([
  // OPP: context require is non-obvious to new AMD users. Why not define require to always be contextual?
  "require",
  "dojo/_base/lang",
  "dojo/Deferred",
  "doh/runner",
  "lib/store/ServerFeedStore",
  "dojo/node!fs",
  "dojo/node!wrench"
  ], function(require, lang, Deferred, doh, ServerFeedStore, fs, wrench) {

    var FEED_ID_FOR_GET_TEST = "2a7fkk5hrt10";
    doh.register("ServerFeedStore", [
      // Test get() method.
      function getTest() {
        var deferred = new doh.Deferred();
        openDatabase({ path: "./ServerFeedStore/dataForGet" }).then(function(database) {
          var store = new ServerFeedStore(database);
          var callback = deferred.getTestCallback(function(result) {
            database.close(function() {
              doh.assertFalse(result instanceof Error);
              debugger;
              doh.assertEqual(result.id, FEED_ID_FOR_GET_TEST);
            });
          });

          store.get(expectedId).then(callback, callback);
        });
        return deferred;
      },
      // Test add() method.
      function addTest() {
        var deferred = new doh.Deferred();
        openDatabase({ path: "./ServerFeedStore/dataForAdd", deleteExisting: true }).then(function(database) {
          var store = new ServerFeedStore(database);
          var newId = null;
          var callback = deferred.getTestCallback(function(result) {
            database.close(function() {
              doh.assertFalse(result instanceof Error);
              doh.assertNotEqual(newId, null);
              doh.assertEqual(newId, result.id);
            });
          });
          store.add({ name: "stuff", url: "http://stuffstuff.net/rsssomething" }).then(function(id) {
            newId = id;
            return store.get(newId);
          }, callback).then(callback, callback);
        });
        return deferred;
      },
      function putTest() {
        var deferred = new doh.Deferred();
        openDatabase({ path: "./ServerFeedStore/dataForPut", copyFrom: "./ServerFeedStore/dataForGet" }).then(function(database) {
          var store = new ServerFeedStore(database);
          var expectedUrl = "http://xyz.net/somethingelse";
          var callback = deferred.getTestCallback(function(result) {
            database.close(function() {
              doh.assertFalse(result instanceof Error);
              doh.assertEqual(result.url, expectedUrl);
            });
          });
          store.get(FEED_ID_FOR_GET_TEST).then(function(feed) {
            // TODO: Test modifying properties that will actually be modified.
            feed.url = expectedUrl;
            return store.put(feed);
          }, callback)
          .then(function() {
            // TODO: What should put resolve to?
            return store.get(FEED_ID_FOR_GET_TEST);
          }, callback)
          .then(callback, callback)
        });
        return deferred;
      },
      function removeTest() {
      },
      function queryAllTest() {
      },
      function queryFilterTest() {
      },
      function querySortTest() {
      },
      function queryMultilevelSortTest() {
      }
    ]);

    function openDatabase(args) {
      var failSilently = false, sourceDir, targetDir = require.toUrl(args.path);

      if((args.deleteExisting || args.copyFrom) && fs.existsSync(targetDir)) {
        wrench.rmdirSyncRecursive(targetDir, failSilently);
      }

      if(args.copyFrom) {
        sourceDir = require.toUrl(args.copyFrom);
        wrench.copyDirSyncRecursive(sourceDir, targetDir);
      } else if(!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir);
      }

      var async = new Deferred();
      require([ "lib/alfredLoader!" + args.path ], lang.hitch(async, "resolve"));
      return async;
    }
  });
