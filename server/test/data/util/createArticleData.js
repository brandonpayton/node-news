define([
    'dojo/node!feedparser'
], function(feedparser) {

    var propertyNames = [
        'guid',
        'date',
        'link',
        'author',
        'title',
        'summary',
        'description'
    ];

    var url = process.argv[process.argv.length - 1];

    feedparser.parseUrl(url)
    .on('error', function(error) {
        console.error(error);
        process.exit(-1);
    })
    .on('article', function(article) {
        var lineComponents = [];
        lineComponents.push(url);

        propertyNames.forEach(function(propertyName) {
            if(propertyName in { summary: 1, description: 1 }) {
                lineComponents.push(propertyName + " of: '" + article.title + "'");
            } else if(propertyName === "date") {
                lineComponents.push(article[propertyName].toISOString());
            } else {
                var propertyValue = article[propertyName];
                lineComponents.push(typeof propertyValue === 'string' ? propertyValue.replace(",", " ") : propertyValue);
            }
        });

        console.log(lineComponents.join(","));
    });
});
