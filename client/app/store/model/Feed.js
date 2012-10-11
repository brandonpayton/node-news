define([
  "dojo/_base/lang",
  "dojo/_base/declare",
  "dojo/Stateful"
], function(lang, declare, Stateful) {
  return declare([ Stateful ], {
    type: "source",
    store: null,
    constructor: function(feedData) {
      // TODO: This seems to be built-in dojo/_base/declare behavior. Is it?
      lang.mixin(this, feedData);
      this.date = Date.parse(feedData.date)
    },
    getArticleStore: function() {
      return this.store.getArticleStore(this._key);
    }
  });
});
