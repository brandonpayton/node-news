define([
    "dojo/_base/declare",
    "dijit/_WidgetBase",
    "dojo/dom-construct"
], function(declare, _WidgetBase, domConstruct) {
    return declare("app.widget.ViewPane", [ _WidgetBase ], {
        _viewFrame: null,
        buildRendering: function() {
            this.inherited(arguments);

            this._viewFrame = domConstruct.create('iframe', {
                src: "article-view.html",
                style: "width: 100%; height: 100%"
            });
            this.domNode.appendChild(this._viewFrame);
        },
        startup: function() {
            this.inherited(arguments);
            
            var self = this;
            this.subscribe("articles", function(args) {
                if(args.event === "select") {
                    // Probably should navigate to different page for each view so content can't feed into the state of subsequent pages.
                    // TODO: Add view API to produce HTML for article iframe.
                    var bodyNode = self._viewFrame.contentDocument.body;
                    bodyNode.innerHTML = args.item.description;
                    bodyNode.scrollTop = 0;
                }
            });
        }
    });
});
