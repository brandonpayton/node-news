define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/Deferred",
    "dojo/when",
    "dojo/on",
    "dojo/topic",
    "dojo/query",
    "dojo/dom-construct",
    "dojo/dom-attr",
    "dojo/dom-class",
    "dojo/date/locale",
    "mustache/mustache",
    "dojo/text!./templates/ArticleListRowTemplate.html",
    "dijit/_WidgetBase",
    "dgrid/OnDemandList"
], function(declare, lang, Deferred, when, on, topic, query, domConstruct, domAttr, domClass, dateLocale, mustache, articleListRowTemplate, _WidgetBase, OnDemandList) {

    var rowTemplate = mustache.compile(articleListRowTemplate);

    function setRowContent(rowElement, article) {
        rowElement.innerHTML = rowTemplate(lang.delegate(article, {
            date: dateLocale.format(article.date, { selector: 'date', formatLength: 'medium' })
        }));

        // Modify hyperlinks to open in new window.
        query(".content a", rowElement).forEach(function(a) {
            domAttr.set(a, "target", "_blank");
        });
    }
    function openRow(rowElement) {
        domClass.add(rowElement, "open");
    }
    function closeRow(rowElement) {
        domClass.remove(rowElement, "open");
    }

    return declare("app.widget.ArticleList", [ _WidgetBase ], {
        _list: null,
        _store: null,
        _openArticles: null,

        buildRendering: function() {
            this.inherited(arguments);
            var listElement = domConstruct.create("div", null, this.domNode);

            var self = this;
            var articleList = this._list = new OnDemandList({
                showHeader: false,
                getBeforePut: false,
                renderRow: function(value) {
                    var rowElement = domConstruct.create("article");
                    setRowContent(rowElement, value);
                    if(self._openArticles[self._store.getIdentity(value)]) {
                        openRow(rowElement);
                    }
                    return rowElement;
                }
            }, listElement);
            // TODO: Can this be done in the instantiation? At a glance, there is only a private var this._class which I don't want to specify.
            articleList.set("className", "article-list");
        },
        
        postCreate: function() {
            this.inherited(arguments);

            var self = this;
            var list = this._list;
            this.subscribe("/feed/select", function(args) {
                // Default all articles to closed.
                self._openArticles = { };

                this._store = args.articleStore;
                list.set('store', this._store);
            });

            list.on(".dgrid-row:click", function(event) {
                var row = list.row(event);
                var article = row.data;

                function isRowHeaderClick() {
                    var headerNode = query("header", row.element)[0],
                        bounds = headerNode.getBoundingClientRect(),
                        clickX = event.clientX,
                        clickY = event.clientY;

                    return (clickX > bounds.left && clickX < bounds.right) &&
                        (clickY > bounds.top && clickY < bounds.bottom);
                }

                if(isRowHeaderClick()) {
                    var store = self._store,
                        articleId = store.getIdentity(article),
                        unpopulated = article.description === undefined,
                        isOpening = self._openArticles[articleId] !== true;

                    self._openArticles[articleId] = isOpening;
                    if(isOpening) {
                        if(unpopulated) {
                            store.get(articleId).then(function(retrievedArticle) {
                                lang.mixin(article, retrievedArticle);

                                if(article.read) {
                                    setRowContent(row.element, article);
                                    openRow(row.element);
                                } else {
                                    article.read = true;
                                    article = store.put(article).then(function(article) {
                                        // Do nothing. The dgrid is observing the result set and will re-render the row.
                                        // TODO: It's error prone and leaky to be sharing responsibility for re-rendering rows. Is there another way to look at this?
                                    }, function(err) {
                                        // TODO: Handle error
                                    });
                                } 
                            }, function(err) {
                                // TODO: Insert error message instead of the content.
                                console.error(err);
                            });
                        } else {
                            openRow(row.element);
                        }
                    } else {
                        closeRow(row.element);
                    }
                }
            });
        }

    });
});
