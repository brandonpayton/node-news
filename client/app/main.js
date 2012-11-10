/**
 * This file is your application’s main JavaScript file. It is listed as a dependency in run.js and will
 * automatically load when run.js loads.
 *
 * Because this file has the special filename “main.js”, and because we’ve registered the “app” package in run.js,
 * whatever object this module returns can be loaded by other files simply by requiring “app” (instead of “app/main”).
 *
 * Our first dependency is to the “dojo/has” module, which allows us to conditionally execute code based on
 * configuration settings or environmental information. Unlike a normal conditional, these branches can be compiled
 * away by the build system; see “staticHasFeatures” in app.profile.js for more information.
 *
 * Our second dependency is to the special module “require”; this allows us to make additional require calls using
 * relative module IDs within the body of our define function.
 *
 * In all cases, whatever function is passed to define() is only invoked once, and the return value is cached.
 *
 * More information about everything described about the loader throughout this file can be found at
 * http://livedocs.dojotoolkit.org/loader/amd.
 */
define([
    'exports',
    'require',
    'dojo/has',
    'dojo/_base/lang',
    './store/FeedStore',
    'dojo/store/JsonRest',
    'dojo/store/Observable'
], function (app, require, has, lang, FeedStore, JsonRestStore, Observable) {
    lang.mixin(app, {
        // TODO: Convert these to first-class stores dedicated to Feeds and Articles.
        feedStore: Observable(new FeedStore())
    });

    require([ './ui/Desktop', 'dojo/domReady!' ], function (Desktop) {
        app.desktop = new Desktop({ class: 'news-app' }).placeAt(document.body);
        app.desktop.startup();
    });
});
