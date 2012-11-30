define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/request",
    "dojo/Deferred",
    "dojo/store/util/QueryResults"
], function(declare, lang, request, Deferred, QueryResults) {
    return declare(null, {
        _couchDbUrl: null,
        _feedId: null,

        getIdentity: function(obj) {
            // Identify each article by feed, date, and link.
            // Rationale: 
            //  1) It's possible the same link could be referenced by different feeds so distinguish by feed.
            //  2) If an article is updated and reposted at the same link but with a different date,
            //      it should show up as a new article because the previous version of the article might have
            //      already been read and deleted. It's better for the user to get a new article than to miss 
            //      the update or possible go against their wishes by resurrecting the article they've already deleted.
            return obj._id || [ this._feedId, obj.date, obj.link ].join("_");
        },

        constructor: function(couchDbUrl, feedId) {
            this._couchDbUrl = couchDbUrl;
            this._feedId = feedId;
        },

        add: function(articleData) {
            var article = {
                type: "article",
                feedId: this._feedId,
                categories: []
            };
            [
                "link",
                "title",
                "author",
                "date",
                "description",
                "categories"
            ].forEach(function(name) {
                if(articleData[name] !== undefined) {
                    article[name] = articleData[name];
                }
            });

            return this.put(article);
        },

        put: function(article) {
            return request.put(
                this._couchDbUrl + "/" + encodeURIComponent(this.getIdentity(article)),
                {
                    data: JSON.stringify(article),
                    headers: {
                        "Content-type": "application/json"
                    },
                    handleAs: "json"
                }
            ).response.then(function(r) {
                var data = r.data;
                if(r.status === 201) {
                    return lang.mixin({}, article, { _id: data.id, _rev: data.rev });
                } else {
                    throw new Error(data.error + ": " + data.reason);
                }
            }, function(error) {
                debugger;
            });
        },

        get: function(id) {
            return request.get(
                this._couchDbUrl + "/" + encodeURIComponent(id),
                { handleAs: "json" }
            ).response.then(function(r) {
                var data = r.data;
                if(r.status === 200) {
                    return data;
                } else if(data.error === "not_found") {
                    return undefined;
                } else {
                    throw new Error(data.error + ": " + data.reason);
                }
            });
        },

        query: function(query, options) {
            var params = [
                "startkey=" + JSON.stringify([ this._feedId, {} ]),
                "endkey=" + JSON.stringify([ this._feedId, 0 ]),
                "descending=true",
                "reduce=false"
            ];
            var viewUrl = this._couchDbUrl + "/_design/news/_view/articles?" + params.join("&");
            return QueryResults(request(viewUrl, { handleAs: "json" }).then(function(results) {
                return results.rows.map(function(row) { return row.value; });
            }));
        }
    });
});
