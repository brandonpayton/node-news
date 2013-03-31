define([
	"dojo/_base/lang",
	"dojo/_base/declare",
	"dojo/Deferred",
	"dojo/store/util/QueryResults",
	"core/_FeedStoreBase"
], function(lang, declare, Deferred, QueryResults, _FeedStoreBase) {

	// TODO: node-postgres handles deserialization of arrays. Fix node-postgres to handle serialization as well.
	function serializeTags(tags) {
		if(tags) {
			return "{" + tags.join(",") + "}";
		} else {
			return "{}";
		}
	}

	function rowToFeed(row) {
		return {
			type: "feed",
			name: row.name,
			url: row.url,
			deleted: row.deleted,
			tags: row.tags
		}
	}

	return declare(_FeedStoreBase, {
		_postgresClient: null,

		constructor: function(postgresClient) {
			this._postgresClient = postgresClient;
		},

		get: function(id) {
			var resultPromise = this._postgresClient.query(
				"SELECT * FROM news.get_feed(url := $1);",
				[ id ]
			);
			return resultPromise.then(function(result) {
				var rows = result.rows;
				if(rows.length === 1) {
					return rowToFeed(rows[0]);
				} else if(rows.length === 0) {
					return undefined;
				} else {
					throw new Error("Retrieved more than one result for id: '" + id + "'");
				}
			});
		},

		// OPP: Update dojo/store docs to cover a resolve/return convention for add() and put().
		add: function(object, options) {
			return this.put(lang.mixin({ type: "feed" }, object), options);
		},

		// TODO: Validate tags and limit them to the typical set of identifier characters.
		put: function(object, options) {
			// TODO: Consider explicit arg validation like the bake() operation I did for IGC. 
			if(object.type !== "feed") {
				throw new Exception("Only objects with type === 'feed' can be placed in the store.");
			}
				
			return this._postgresClient.query(
				"SELECT * FROM news.save_feed(url := $1, name := $2, tags := $3);",
				[ object.url, object.name, serializeTags(object.tags) ]
			).then(function(result) {
				return result.rows[0].save_feed;
			});
		},

		remove: function(id) {
			function ignoreResultValue() { }

			return this._postgresClient.query(
				"SELECT news.soft_delete_feed(url := $1);",
				[ id ]
			).then(ignoreResultValue);
		},

		query: function(query, options) {
			query = query || {};
			
			var resultPromise;
			if(query.tag !== undefined) {
				resultPromise = this._postgresClient.query(
					"SELECT * FROM news.get_feeds_with_tag(tag := $1);",
					[ query.tag ]
				);
			} else if(query.includeTags && query.includeTaglessFeeds) {
				resultPromise = this._postgresClient.query(
					"SELECT * FROM news.get_tags_and_tagless_feeds();"
				);
			} else {
				if(Object.keys(query).length > 0) {
					throw new Error("Unsupported query.");
				} 

				resultPromise = this._postgresClient.query(
					"SELECT * FROM news.typed_feed ORDER BY name;"
				);
			}

			return QueryResults(resultPromise.then(function(result) {
				var q = query;
				return result.rows.map(function(row) {
					if(row.type === "tag") {
						return {
							type: "tag",
							name: row.name
						};
					} else if(row.type === "feed") {
						return rowToFeed(row);
					} else {
						throw new Error("Unknown row type: " + row.type);
					}
				});
			}));
		}
	});
});
