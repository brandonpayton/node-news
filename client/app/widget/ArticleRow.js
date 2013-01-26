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
        class: "article-row",
        templateString: articleRowTemplate,
        article: null,
        store: null,
        open: false,

        _populatedArticleDescription: false,

        buildRendering: function() {
            this.inherited(arguments);

            // TODO: Set read/unread class on header.
            if(!this.article.read) {
                domClass.add(this.headerNode, "unread");
            }
        },

        postCreate: function() {
            var self = this;
            // Toggle open status when header is clicked.
            this.own(on(this.headerNode, "click", function() {
                self.set("open", !self.get('open'));
            }));
        },

        _setOpenAttr: function(isOpen) {
            if(isOpen) {
                var article = this.article;
                if(!article.read) {
                    article.read = true;

                    // NOTE: It would look better if we removed 'unread' immediately,
                    // but I'm waiting for the put() to be successful so only the truth is represented to the user.
                    this.store.put(article).then(lang.hitch(this, function() {
                        domClass.remove(this.headerNode, "unread");
                    }));
                }
                
                if(!this._populatedArticleDescription) {
                    this._populatedArticleDescription = true;
                    this.articleDescriptionNode.innerHTML = this.article.description;
            
                    // Modify hyperlinks to open in new window.
                    dojoQuery("a", this.articleDescriptionNode).forEach(function(anchorElement) {
                        domAttr.set(anchorElement, "target", "_blank");
                    });
                }

                domClass.add(this.domNode, "open");
            } else {
                domClass.remove(this.domNode, "open");
            }
            this.open = isOpen;
        },

        _formatDate: function(dateValue) {
            return dateLocale.format(dateValue, { selector: 'date', formatLength: 'medium' })
        }
    });
});
