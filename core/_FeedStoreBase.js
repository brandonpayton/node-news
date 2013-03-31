define([
    "dojo/_base/declare"
    /*=====, "dojo/store/api/Store" =====*/
], function(declare /*=====, Store =====*/) {

    // No base class, but for purposes of documentation, the base class is dojo/store/api/Store
    var base = null;
    /*===== base = Store =====*/

    return declare(base, {
        getIdentity: function(object) {
            var type = object.type;
            if(type === "feed") {
                return object.url;
            } else if(type === "tag") {
                return object.name;
            } else {
                throw new Error("Object of type '" + type + "' is not supported by this store.");
            }
            return object.url;
        }
    });
});
