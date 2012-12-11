define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/Deferred",
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
], function(declare, lang, Deferred, on, topic, query, domConstruct, domAttr, domClass, dateLocale, mustache, articleRowTemplate, _WidgetBase, OnDemandList) {

    var rowTemplate = mustache.compile(articleRowTemplate);

    return declare("app.widget.ArticleList", [ _WidgetBase ], {
        _list: null,
        _openArticles: null,

        buildRendering: function() {
            this.inherited(arguments);
            var listElement = domConstruct.create("div", null, this.domNode);

            var self = this;
            var articleList = this._list = new OnDemandList({
                getBeforePut: false,
                renderRow: function(value) {
                    console.log("rendering row");
                    var rowElement = domConstruct.create("article", {
                        class: value.read ? 'article-read' : 'article-unread'
                    });
                    // TODO: Make openArticles a property of the dgrid instead of the parent widget.
                    if(self.openArticles[value._id]) {
                        domClass.add(rowElement, "open");
                    }
                    try {
                    rowElement.innerHTML = rowTemplate(lang.delegate(value, {
                        date: dateLocale.format(value.date, { selector: 'date', formatLength: 'medium' }),
                        // TODO: Think of better way to get constant length snippet. (Probably create snippet when article is first saved)
                        snippet: value.description.substr(0, 500).replace(/<[^>]*>/, " ")
                    }));
                    } catch(err) {
                        console.error(err);
                    }

                    // TODO: Ask Ken if there is a reason not to attach event handler to row child instead of using .dgrid-row:click.
                    on(query("header", rowElement)[0], "click", function() {
                        var isOpen = !self.openArticles[value._id];
                        // Toggle open.
                        self.openArticles[value._id] = isOpen;
                        if(isOpen) { domClass.add(rowElement, "open"); }
                        else { domClass.remove(rowElement, "open"); }
                    });

                    // Cause hyperlinks to open in new window.
                    query(".content a", rowElement).forEach(function(a) {
                        domAttr.set(a, "target", "_blank");
                    });
                    return rowElement;
                }
            }, listElement);
        },
        
        postCreate: function() {
            this.inherited(arguments);

            var self = this;
            var list = this._list;
            this.subscribe("/feed/select", function(args) {
                // Default all articles to closed.
                self.openArticles = { };

                list.set('store', args.articleStore);
            });

            list.on(".dgrid-row:click", function(event) {
                var row = list.row(event);
                if(!row.data.read) {
                    list.updateDirty(row.id, "read", true);
                    list.save();
                }
            });
        }

    });
});
