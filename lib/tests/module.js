require.on("error", function(error) {
    console.log("ERROR", error.src, error.id);  
});
console.log("woah");
define([
    "lib/tests/store/ServerFeedStore"
], 1 /* TODO: Why pass 1 here? This is what dojo/tests/module.js does. */);
console.log("oh")