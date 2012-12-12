define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/Deferred",
    "dojo/topic",
    "app/main",
    "dgrid/OnDemandList",
    "dgrid/Keyboard",
    "dgrid/Selection",
    // Change to relative module ID.
    "app/widget/FeedPropertiesDialog",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/text!./templates/FeedPane.html",
    // TODO: Weren't these sorts of template dependency includes supposed to be no longer required?
    "dijit/layout/ContentPane",
    "dijit/Toolbar",
    "dijit/form/Button"
], function(declare, lang, Deferred, topic, app, OnDemandList, Keyboard, Selection, FeedPropertiesDialog, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, template) {

    var FeedList = declare([ OnDemandList, Keyboard, Selection ], {
        selectionMode: "single",
        renderRow: function(value, options) {
            return this.inherited(arguments, [ value.title, options ]);
        }
    });

    return declare("app.widget.FeedPane", [ _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin ], {
        baseClass: "feedPane",
        treeModel: null,
        tree: null,
        templateString: template,

        _feedPropertiesDialog: null,

        constructor: function(args) {
           this._feedPropertiesDialog = new FeedPropertiesDialog();
        },

        buildRendering: function() {
            this.inherited(arguments);

            this._list = new FeedList({ }, this.feedListElement);
            this._list.set("className", "feed-list");
            this._list.set("store", app.feedStore);
        },

        postCreate: function() {
            this.inherited(arguments);

            var list = this._list;
            list.on("dgrid-select", function(event) {
                var row = event.rows[0],
                    item = row.data;

                var feedId = app.feedStore.getIdentity(item);
                topic.publish("/feed/select", {
                    feed: item,
                    articleStore: app.feedStore.getArticleStore(feedId)
                });
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
