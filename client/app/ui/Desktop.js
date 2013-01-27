define([
    "dojo/_base/declare",
    "dijit/layout/BorderContainer",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/text!./templates/Desktop.html",
    // For template support
    "dojo/parser",
    "../widget/FeedPane",
    "../widget/ArticleList"
], function(declare, BorderContainer, _TemplatedMixin, _WidgetsInTemplateMixin, template) {
    return declare([ BorderContainer, _TemplatedMixin, _WidgetsInTemplateMixin ], {
        class: "news-app",

        templateString: template,
        gutters: true,

        feedStore: null,
        articleStore: null
    });
});
