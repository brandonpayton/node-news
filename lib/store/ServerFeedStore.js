define([
  "dojo/_base/lang",
  "dojo/_base/declare",
  "dojo/Deferred",
  "dojo/store/util/QueryResults",
  "dojo/node!url",
  "dojo/node!couch-client",
  "lib/nodeCallback",
  "lib/store/ArticleStore"
], function(lang, declare, Deferred, QueryResults, url, CouchClient, nodeCallback, ArticleStore) {

  function normalizeUrlStr(urlStr) {
    var u = url.parse(urlStr);
    u.host = u.host.toLowerCase();
    u.protocol = u.protocol.toLowerCase();
    return url.format(urlStr);
  }

  return declare([ ], {
    // Base URL
    _couchClient: null,

    // TODO: How to document this in Dojo format?
    constructor: function(couchDatabaseUrl) {
      this._couchClient = CouchClient(couchDatabaseUrl);
    },

    get: function(id) {
      var async = new Deferred()
      this._couchClient.get(id, nodeCallback(async))
      return async.promise
    },

    query: function(query, options) {
      var async = new Deferred();
      // TODO: Why do we have to repeat the base path of /news here?
      this._couchClient.view("news/feeds", query, nodeCallback(async));
      return QueryResults(async.then(function(results) {
        return results.rows.map(function(row) { return row.value; });         
      }));
    },

    put: function(object, options) {
      var async = new Deferred();
      object = lang.mixin({ _id: object.url, type: "feed" }, object); 
      this._couchClient.save(object, nodeCallback(async));
      return async.promise;
    },

    // OPP: Update dojo/store docs to cover a resolve/return convention for add() and put().
    add: function(object, options) {
      // TODO: Use overwrite: false?
      return this.put(object, options);
    },

    remove: function(id) {
      var async = new Deferred();
      this._couchClient.remove(id, nodeCallback(async));
      return async.promise;
    },

    getArticleStore: function(feedId) {
        return new ArticleStore(this._couchClient, feedId);
    }
  });
});
