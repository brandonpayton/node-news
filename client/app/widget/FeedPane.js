define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/topic",
    "dojo/on",
    "dojo/dom-class",
    "dgrid/OnDemandGrid",
    "dgrid/Keyboard",
    "dgrid/Selection",
    "dgrid/tree",
    "./FeedPropertiesDialog",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/text!./templates/FeedPane.html",
    "dijit/Menu",
    "dijit/MenuItem",
    // TODO: Weren't these sorts of template dependency includes supposed to be no longer required?
    "dijit/layout/ContentPane",
    "dijit/Toolbar",
    "dijit/form/Button"
], function(declare, lang, topic, on, domClass, OnDemandGrid, Keyboard, Selection, tree, FeedPropertiesDialog, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, template, Menu, MenuItem) {

    var FeedList = declare([ OnDemandGrid, Keyboard, Selection ], {
        selectionMode: "single",
        showHeader: false,
        columns: [
            tree({ field: "name", allowDuplicates: true })
        ]
    });

    return declare("app.widget.FeedPane", [ _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin ], {
        baseClass: "feed-pane",
        store: null,
        _list: null,
        _contextMenu: null,
        templateString: template,

        _feedPropertiesDialog: null,

        constructor: function(args) {
           this._feedPropertiesDialog = new FeedPropertiesDialog();
        },

        buildRendering: function() {
            this.inherited(arguments);

            var store = this.store;
            var list = this._list = new FeedList({
                className: "feed-list",
                store: store
            }, this.feedListElement);
            list.set("query", null);

            var contextMenu = this._contextMenu = new Menu({ baseClass: "contextMenu", refocus: false });
            contextMenu.addChild(new MenuItem({
                label: "Delete Feed",
                onClick: function() {
                    store.remove(contextMenu.feedId).then(function() {
                        list.refresh();
                    }, function(err) {
                        // TODO: How to report errors. I'd like something simple, non-invasive across the app. Maybe it's better to do local popups (tooltips) with error messages.
                    });
                }
            }));
        },

        postCreate: function() {
            this.inherited(arguments);

            var store = this.store;
            var list = this._list;
            var contextMenu = this._contextMenu;
            var feedPropertiesDialog = this._feedPropertiesDialog;

            list.on("dgrid-select", function(event) {
                var row = event.rows[0],
                    item = row.data;

                var id = store.getIdentity(item);
                if(item.type === "tag") {
                    topic.publish("/tag/select", id);
                } else if(item.type === "feed") {
                    topic.publish("/feed/select", id);
                }
            });
            list.on(".dgrid-cell:contextmenu", function(event) {
                var row = list.row(event);

                if(row.data.type === "feed") {
                    contextMenu.feedId = store.getIdentity(row.data);
                    contextMenu._scheduleOpen(event.target, null, { x: event.pageX, y: event.pageY });
                }

                event.preventDefault();
            });
            list.on(".dgrid-row:dblclick", function(event) {
                var row = list.row(event);

                if(row.data.type === "feed") {
                    var fpd = feedPropertiesDialog;
                    fpd.set('title', "Edit Feed");
                    fpd.set('value', row.data);
                    fpd.show().then(function(resultsPromise) {
                        resultsPromise.then(function() {
                            var updatedFeed = lang.mixin({}, row.data, fpd.get('value'));
                            store.put(updatedFeed).then(function() {
                                list.refresh();
                            });
                        });
                    });
                }

                event.preventDefault();
            });

            //
            // Auto expand selected row but only toggle expansion for clicks on already-selected row
            //
            // NOTE: This is too complicated, but this is the only way I found to avoid auto expanding
            //  on selection and immediately toggling closed again.
            var selectedDuringCurrentClick = false;
            list.on("dgrid-select", function(event) {
                selectedDuringCurrentClick = true;
            });
            list.on(".dgrid-cell:click", function(event) {
                if(!domClass.contains(event.target, "dgrid-expando-icon")) {
                    var row = list.row(event);
                    if(selectedDuringCurrentClick) {
                        // TODO: CONTRIB: Lobby for isExpanded method for dgrid+tree
                        if(!list._expanded[row.id]) {
                            list.expand(row, true);
                        }
                    } else {
                        list.expand(row);
                    }
                }

                selectedDuringCurrentClick = false;
            });
        },

        handleAddClick: function() {
            var self = this;
            var fpd = this._feedPropertiesDialog;
            fpd.set('title', "Add Feed");
            fpd.set('value', {});
            fpd.show().then(function(resultsPromise) {
                resultsPromise.then(function() {
                    self.store.add(fpd.get('value')).then(function() {
                        self._list.refresh();
                    });
                });
            });
        },

        handleFeedClick: function(item) {
        },

        handleRemoveClick: function() {

        }
    });
});
