define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/Deferred",
    "dojo/topic",
    "dojo/on",
    "app/main",
    "dgrid/OnDemandGrid",
    "dgrid/Keyboard",
    "dgrid/Selection",
    "dgrid/tree",
    // Change to relative module ID.
    "app/widget/FeedPropertiesDialog",
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
], function(declare, lang, Deferred, topic, on, app, OnDemandGrid, Keyboard, Selection, tree, FeedPropertiesDialog, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, template, Menu, MenuItem) {

    var FeedList = declare([ OnDemandGrid, Keyboard, Selection ], {
        selectionMode: "single",
        showHeader: false,
        columns: [
            tree({ field: "name", allowDuplicates: true })
        ]
    });

    return declare("app.widget.FeedPane", [ _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin ], {
        baseClass: "feedPane",
        _store: null,
        _list: null,
        _contextMenu: null,
        templateString: template,

        _feedPropertiesDialog: null,

        constructor: function(args) {
            // TODO: Get rid of this global reference and use dependency injection instead.
            this._store = app.feedStore;
           this._feedPropertiesDialog = new FeedPropertiesDialog();
        },

        buildRendering: function() {
            this.inherited(arguments);

            var list = this._list = new FeedList({ store: this._store }, this.feedListElement);
            list.set("className", "feed-list");
            list.set("store", app.feedStore);

            var store = this._store;
            var contextMenu = this._contextMenu = new Menu({ baseClass: "contextMenu", refocus: false });
            contextMenu.addChild(new MenuItem({
                label: "Delete Feed",
                onClick: function() {
                    store.remove(contextMenu.feedId).then(function() {
                        // TODO: Probably select root feed collection once feeds are nested under root and tag.
                    }, function(err) {
                        // TODO: How to report errors. I'd like something simple, non-invasive across the app. Maybe it's better to do local popups (tooltips) with error messages.
                    });
                }
            }));
        },

        postCreate: function() {
            this.inherited(arguments);

            var list = this._list;
            list.on("dgrid-select", function(event) {
                var row = event.rows[0],
                    item = row.data;

                var feedId = app.feedStore.getIdentity(item);
                topic.publish("/feed/select", {
                    feed: feedId,
                    articleStore: app.feedStore.getArticleStore(feedId)
                });
            });
            var self = this;
            list.on(".dgrid-row:contextmenu", function(event) {
                var row = list.row(event);

                var menu = self._contextMenu;
                menu.feedId = self._store.getIdentity(row.data);
                menu._scheduleOpen(event.target, null, { x: event.pageX, y: event.pageY });

                event.preventDefault();
            });
        },

        handleAddClick: function() {
            var fpd = this._feedPropertiesDialog;
            fpd.set('title', "Add Feed");
            fpd.show().then(function(resultsPromise) {
                resultsPromise.then(function() {
                    app.feedStore.add(fpd.get('value')); 
                });
            });
        },

        handleEditClick: function() {
            var fpd = this._feedPropertiesDialog;
            fpd.set('title', "Edit Feed");
            fpd.set('value', { name: 'sample name', url: 'sample url' });
            fpd.show().then(function(resultsPromise) {
                resultsPromise.then(function() {
                    
                });
            });
        },

        handleFeedClick: function(item) {
        },

        handleRemoveClick: function() {

        }
    });
});
