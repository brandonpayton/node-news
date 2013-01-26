define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/Deferred",
    "dojo/when",
    "dojo/on",
    "dojo/dom-construct",
    "dojo/topic",
    "./ArticleRow",
    "dijit/_WidgetBase",
    "dgrid/OnDemandList",
    "dijit/Menu",
    "dijit/MenuItem"
], function(declare, lang, Deferred, when, on, domConstruct, topic, ArticleRow, _WidgetBase, OnDemandList, Menu, MenuItem) {

    return declare("app.widget.ArticleList", [ _WidgetBase ], {
        _list: null,
        store: null,
        _openArticlesMap: null,

        buildRendering: function() {
            this.inherited(arguments);
            var listElement = domConstruct.create("div", null, this.domNode);

            var self = this;
            var articleList = this._list = new OnDemandList({
                store: this.store,
                showHeader: false,
                getBeforePut: false,
                insertRow: function() {
                    var rowElement = this.inherited(arguments);
                    rowElement.widget.startup();
                    return rowElement;
                },
                removeRow: function(rowElement) {
                    var articleRowWidget = rowElement.widget;
                    var articleId = self.store.getIdentity(articleRowWidget.article);

                    if(articleRowWidget.open) {
                        self._openArticlesMap[articleId] = true;
                    } else {
                        delete self._openArticlesMap[articleId];
                    }

                    rowElement.widget.destroyRecursive();
                    this.inherited(arguments);
                },
                renderRow: function(article) {
                    var articleRowWidget = new ArticleRow({
                        article: article,
                        store: self.store,
                        open: self._openArticlesMap[self.store.getIdentity(article)]
                    });

                    var rowElement = articleRowWidget.domNode;
                    rowElement.widget = articleRowWidget;
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
            this.subscribe("/feed/select", function(feedUrl) {
                // Default all articles to closed.
                self._openArticlesMap = { };
                list.set('query', { feedUrl: feedUrl });
            });
            this.subscribe("/tag/select", function(tag) {
                // Default all articles to closed.
                self._openArticlesMap = { };
                list.set('query', { tag: tag });
            });
        }
    });
});
