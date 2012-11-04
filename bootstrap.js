// TODO: What happens with this "global" in node.js?
dojoConfig = {
    async: true,
    baseUrl: __dirname + "/client",
    packages: [
        "dojo",
        "dijit",
        "dojox",
        "util",{
            name: "doh",
            location: "util/doh"
        },{
            name: "lib",
            location: "../lib"
        }
    ]  
};
require(dojoConfig.baseUrl + "/dojo/dojo.js");
