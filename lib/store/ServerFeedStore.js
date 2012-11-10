define([
  "dojo/_base/lang",
  "dojo/_base/declare",
  "dojo/Deferred",
  "dojo/store/util/QueryResults",
  "dojo/node!url",
  "lib/sofaCallback",
  "lib/store/ArticleStore"
], function(lang, declare, Deferred, QueryResults, url, sofaCallback, ArticleStore) {

  function normalizeUrlStr(urlStr) {
    var u = url.parse(urlStr);
    u.host = u.host.toLowerCase();
    u.protocol = u.protocol.toLowerCase();
    return url.format(urlStr);
  }

  return declare([ ], {
    // Base URL
    _couchDb: null,

    // TODO: How to document this in Dojo format?
    constructor: function(couchDb) {
        this._couchDb = couchDb;
    },

    get: function(id) {
      var async = new Deferred()
      this._couchDb.get(id, sofaCallback(async))
      return async.promise
    },

    query: function(query, options) {
      var async = new Deferred();
      // TODO: Why do we have to repeat the base path of /news here?
      this._couchDb.view({
          doc: "news",
          view: "feeds",
          params: query,
          callback: sofaCallback(async)
      });
      return QueryResults(async.then(function(results) {
          debugger;
        return results.rows.map(function(row) { return row.value; });         
      }));
    },

    put: function(object, options) {
      var async = new Deferred();
      object = lang.mixin({ _id: encodeURIComponent(object.url), type: "feed" }, object); 
      // TODO: Implement conflict resolution logic.
      this._couchDb.save(object, sofaCallback(async));
      return async.then(function(response) { return object; });
    },

    // OPP: Update dojo/store docs to cover a resolve/return convention for add() and put().
    add: function(object, options) {
      // TODO: Use overwrite: false?
      return this.put(object, options);
    },

    remove: function(id) {
      return this.get(id).then(lang.hitch(this, function(feed) {
        feed.deleted = true;
        return this.put(feed);
      }));
    },

    getArticleStore: function(feedId) {
        return new ArticleStore(this._couchDb, feedId);
    }
  });
});
