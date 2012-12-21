define({
    language: "javascript",
    views: {
        tags: {
            map: function(doc) {
                if(doc.type === 'feed') {
                    var hasTags = doc.tags && doc.tags.length > 0;
                    if(doc.tags && doc.tags.length > 0) {
                        var tags = doc.tags.split(/\s+/);
                        tags.forEach(function(tag) {
                            emit(tag, 1);
                        });
                    }
                }
            },
            reduce: function(keys, values, rereduce) {
                return sum(values);
            }
        },
        feeds: {
            map: function(doc) {
                if(doc.type === 'feed' && !doc.deleted) {
                    if(doc.tags && doc.tags.length > 0) {
                        var tags = doc.tags.split(/\s+/);
                        tags.forEach(function(tag) {
                            emit([ tag, doc.name ], doc);
                        });
                    } else {
                        emit([ "", doc.name ], doc);
                    }
                }
            }
        },
        articles: {
            map: function(doc) {
                if(doc.type === 'article') {
                    var docWithoutDescription = Object.keys(doc).reduce(function(memo, key) {
                        if(key !== "description") {
                            memo[key] = doc[key];
                        }
                        return memo;
                    }, { });

                    emit([ doc.feedId, doc.date ], docWithoutDescription);
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
    },
    validate_doc_update: function(newDoc, savedDoc, userCtx) {
        if(newDoc.type === 'feed') {
            if(!newDoc.url) {
                throw { forbidden: "feed must have url property." };
            } else if(newDoc._id !== newDoc.url) {
                throw { forbidden: "feed _id must match url property." };
            }
        }
    }
});
