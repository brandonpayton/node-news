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
