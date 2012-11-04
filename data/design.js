define({
    "language": "javascript",
    "views": {
        "sources": {
            "map": function(doc) {
                if(doc.type === 'source') emit(doc._id, doc);
            }
        },
        "articles": {
            map: function(doc) {
                if(doc.type === 'article') emit(doc._id, doc);
            }
        }
    },
    "lists": {
        "article-list": function(head, req) {
            var row, articles = [];
            while(row = getRow()) {
                if(row.value._sourceId === req.query.source) {
                    articles.push(row.value);
                }
            }
            return articles;
        }
    }
});
