define({
    "language": "javascript",
    "views": {
        "feeds": {
            "map": function(doc) {
                if(doc.type === 'feed') emit(doc.title, doc);
            }
        },
        "articles": {
            map: function(doc) {
                if(doc.type === 'article') {
                    emit([ doc.feedId, doc.date ], doc);
                }
            },
            reduce: function(keys, values, rereduce) {
                var reduction = { };
                if(rereduce) {
                    reduction.unread = values.reduce(function(memo, value) {
                        return memo + value.unread;
                    }, 0);
                    reduction.total = values.reduce(function(memo, value) {
                        return memo + value.total;
                    }, 0);
                } else {
                    reduction.unread = values.reduce(function(memo, value) {
                        return memo + (!value.read ? 1 : 0);
                    }, 0);
                    reduction.total = values.length;
                }

                reduction.read = reduction.total - reduction.unread;
                return reduction;
            }
        }
        "article_lookup": {
            map: function(doc) {
                if(doc.type === "article") {
                    emit([ doc.feedId, doc.link ]);
                }
            }
        }
    }
});