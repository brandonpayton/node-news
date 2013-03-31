define([
	'require',
	'./store/FeedStore',
	'./store/ArticleStore'
], function (require, FeedStore, ArticleStore) {
	// A future version may instantiate a different UI depending on platform or form factor.
	require([ './ui/Desktop', 'dojo/domReady!' ], function (Ui) {
		var dataUrl = "../data";
		var ui = new Ui({
			feedStore: new FeedStore({ dataUrl: dataUrl }),
			articleStore: new ArticleStore({ dataUrl: dataUrl })
		});
		ui.placeAt(document.body);
		ui.startup();
	});
});
