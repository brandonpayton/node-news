// This program converts our CouchDB design document to JSON.
// Otherwise, we'd have to maintain the document as JSON and edit string representations
// of the map/reduce functions rather than the real thing.
require([ "data/design" ], function(design) {
  function couchify(object) {
    return Object.keys(object).reduce(function(memo, key) {
      var value = object[key];
      var type = typeof value;

      memo[key] = type === "function" ? value.toString()
          : type === "object" ? couchify(value)
          : value;

      return memo;
    }, { });
  }

  console.log(JSON.stringify(couchify(design)));
});
