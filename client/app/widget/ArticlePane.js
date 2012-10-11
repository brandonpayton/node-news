define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/Deferred",
    "dojo/when",
    "dojo/topic",
    "dojo/dom-class",
    "dojo/date/locale",
    "app/main",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/text!./templates/ArticlePane.html",
    "dgrid/OnDemandGrid",
    "dgrid/Keyboard",
    "dgrid/Selection"
], function(declare, lang, Deferred, when, topic, domClass, dateLocale, app, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, template, OnDemandGrid, Keyboard, Selection) {
    return declare("app.widget.ArticlePane", [ _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin ], {
        templateString: template,
        _grid: null,

        buildRendering: function() {
            this.inherited(arguments);

            var ArticleGrid = declare([ OnDemandGrid, Keyboard, Selection ]);

            var articleGrid = this._grid = new ArticleGrid({
                columns: {
                    date: {
                        label: "Date",
                        formatter: function(d) {
                            return dateLocale.format(d);
                        }
                    },
                    author: "Author",
                    title: "Title"
                },
                selectionMode: "single",
                cellNavigation: false,
                // TODO: Remove this. It was added to help along progress changing row style depending on read/unread state.
                getBeforePut: false,

                _updateArticleClass: function(rowRelatedObject) {
                    var row = this.row(rowRelatedObject);
                    var rowElement = row.element;
                    [ 'article-read', 'article-unread' ].forEach(lang.hitch(rowElement.classList, "remove"));
                    rowElement.classList.add(row.data.read ? 'article-read' : 'article-unread');
                },

                renderRow: function(value) {
                    var rowElement = this.inherited(arguments);
                    domClass.remove(rowElement, [ 'article-read', 'article-unread' ]);
                    domClass.add(rowElement, value.read ? 'article-read' : 'article-unread');
                    return rowElement;
                }
            }, this.gridElement);
        },

        postCreate: function() {
            this.inherited(arguments);

            var grid = this._grid;
            this.subscribe("feeds", function(args) {
                if(args.event === "execute") {
                    grid.set('store', args.item.getArticleStore());
                }
            });

            grid.on("dgrid-select", function(event) {
                var row = event.rows[0];
                grid.updateDirty(row.id, "read", true);
                grid.save();
                topic.publish("articles", { event: "select", item: row.data });
            });
        }

    });
});
