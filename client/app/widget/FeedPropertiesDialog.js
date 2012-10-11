define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    // TODO: Convert to relative module id
    "app/widget/Dialog",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    // TODO: Why aren't relative paths working? Fix it and convert to relative module identifier.
    "dojo/text!app/widget/templates/FeedPropertiesWidget.html",
    // For Template
    "dijit/form/TextBox",
    "dijit/form/Button"
], function(declare, lang, Dialog, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, template) {
    
    var FeedPropertiesWidget = declare([ _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin ], {
        baseClass: "feedPropertiesDialog",
        templateString: template
    });

    return declare([ Dialog ], {
        buildRendering: function() {
            this.inherited(arguments);
            this._widget = new FeedPropertiesWidget({
                onCancel: lang.hitch(this, "onCancel")
            });
            this.set("content", this._widget);
        },

        _getValueAttr: function() {
            // TODO: Convert this to use a dojo Form and get a built-in _getValueAttr
            var w = this._widget;
            return {
                name: w.nameBox.get('value'),
                url: w.urlBox.get('value')
            };
        },

        _setValueAttr: function(/*Object*/ obj) {
            var w = this._widget;
            w.nameBox.set("value", obj.name);
            w.urlBox.set("value", obj.url);
        }
    });
});
