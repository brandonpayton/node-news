node-news
=========

node-news is a simple RSS/Atom feed aggregator with a browser-based client and a NodeJS-based HTTP server.
Both client and server rely on the Dojo Toolkit which allows them to share similar patterns and idioms.
PostgreSQL is used for the database.

## Creating the Database

To create a the database on a local postgres instance:
```
psql --set database_name=news < server/data/create.pgsql
```
The default database name is "news", but use whatever name you'd like and update the postgresConnectionString in server/config.json.

## Configuring the Server

The server configuration is in server/config.json and is hopefully self-explanatory.

## Running the server
In the root of the project, run the following command:
```
node node-bootstrap.js load=server
```

## Launching the client

Browse to ```http://<server-ip-or-hostname>:<server-port>```.

The client is intended to support modern desktop browsers such as Chrome, Firefox, Safari, Opera, and IE9+, but so far, it has only been tested with the latest versions of Chrome and Firefox on OSX.

CAUTION: I haven't tested the client with IE yet, but nothing in the client should preclude IE9 support.

## Thanks

Thanks to [Justin Pitts](https://github.com/justinpitts) for giving advice and feedback as I became acquainted with Postgres over the last month.

## License

New BSD License © 2013 Brandon Payton http://happycode.net. 
