define({
    "language": "javascript",
    "views": {
        "feeds": {
            "map": function(doc) {
                if(doc.type === 'feed') emit(doc._id, doc);
            }
        },
        "articles": {
            map: function(doc) {
                if(doc.type === 'article') {
                    emit([ doc._feedId, doc._id ], doc);
                }
            }
        }
    }
});
