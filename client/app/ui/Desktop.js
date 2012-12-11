define([
    "dojo/_base/declare",
    "dijit/layout/BorderContainer",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/text!./templates/Desktop.html",
"dojo/parser", "../widget/FeedPane", "../widget/ViewPane", "../widget/ArticleList"

], function(declare, BorderContainer, _TemplatedMixin, _WidgetsInTemplateMixin, template) {
    return declare("app.ui.Desktop", [ BorderContainer, _TemplatedMixin, _WidgetsInTemplateMixin ], {
        templateString: template,
        gutters: true
    });
});
