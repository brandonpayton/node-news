define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/Deferred",
    "dojo/topic",
    "app/main",
    // Change to relative module ID.
    "app/widget/FeedPropertiesDialog",
    "dijit/layout/BorderContainer",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/text!./templates/FeedPane.html",
    "dijit/tree/ObjectStoreModel",
    // TODO: Weren't these sorts of template dependency includes supposed to be no longer required?
    "dijit/Toolbar",
    "dijit/Tree",
    "dijit/form/Button"
], function(declare, lang, Deferred, topic, app, FeedPropertiesDialog, BorderContainer, _TemplatedMixin, _WidgetsInTemplateMixin, template, ObjectStoreModel) {
    return declare("app.widget.FeedPane", [ BorderContainer, _TemplatedMixin, _WidgetsInTemplateMixin ], {
        baseClass: "feedPane",
        treeModel: null,
        tree: null,
        templateString: template,

        _feedPropertiesDialog: null,

        constructor: function(args) {
            var treeModel = this.treeModel = new ObjectStoreModel({
                store: app.feedStore,
                mayHaveChildren: function(item) {
                    return false;
                },
                getLabel: function(item) { return item.title; }
            });
            treeModel.root = { };
            this._feedPropertiesDialog = new FeedPropertiesDialog();
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
            var feedId = app.feedStore.getIdentity(item);
            topic.publish("/feed/select", {
                feed: item,
                articleStore: app.feedStore.getArticleStore(feedId)
            });
        },

        handleRemoveClick: function() {

        }
    });
});
