define([
    "dojo/_base/lang",
    "dojo/_base/declare",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/text!./templates/ArticleRow.html",
    "dojo/query",
    "dojo/on",
    "dojo/dom-attr",
    "dojo/dom-class",
    "dojo/date/locale"
], function(lang, declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, articleRowTemplate, dojoQuery, on, domAttr, domClass, dateLocale) {
    return declare([ _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin ], {
        class: "articleRow",
        templateString: articleRowTemplate,
        article: null,
        open: false,

        _populatedArticleDescription: false,

        constructor: function(args) {
            var article = args.article;
            args.article = lang.delegate(article, {
                date: dateLocale.format(article.date, { selector: 'date', formatLength: 'medium' })
            });
        },

        buildRendering: function() {
            this.inherited(arguments);

            // TODO: Set read/unread class on header.
            
            // Modify hyperlinks to open in new window.
            dojoQuery("a", this.articleDescriptionNode).forEach(function(anchorElement) {
                //domAttr.set(anchorElement, "target", "_blank");
            });
        },

        postCreate: function() {
            var self = this;
            this.own(on(this.headerNode, "click", function() {
                // TODO: Set 'read' flag and save.
                
                if(!self._populatedArticleDescription) {
                    self._populatedArticleDescription = true;
                    self.articleDescriptionNode.innerHTML = self.article.description;
                }
                
                // Toggle open status.
                self.set("open", !self.get('open'));
            }));
        },

        _setOpenAttr: function(isOpen) {
            if(isOpen) {
                domClass.add(this.domNode, "open");
            } else {
                domClass.remove(this.domNode, "open");
            }
            this.open = isOpen;
        }
    });
});
