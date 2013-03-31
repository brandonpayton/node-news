// TODO: What happens with this "global" in node.js?
dojoConfig = {
    async: true,
    baseUrl: __dirname,
    packages: [
        "dojo",
        "util",
        "client",
        "core",
        "server",
        {
            name: "dijit",
            location: "client/dijit"
        }, {
            name: "dojox",
            location: "client/dojox"
        }, {
            name: "doh",
            location: "util/doh"
        } 
    ]  
};
require(dojoConfig.baseUrl + "/dojo/dojo.js");
