// This program converts our CouchDB design document to JSON.
// Otherwise, we'd have to maintain the document as JSON and edit string representations
// of the map/reduce functions rather than the real thing.
// TODO: Why did I have to use the hack of using define() to be able to use a relative mid? Shouldn't require() support that?
define([ "./design" ], function(design) {
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
