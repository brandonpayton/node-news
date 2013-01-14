COPY feed (url, name) FROM '${base_path}/feedData.csv' WITH csv;
COPY tag_to_feed (tag, feed_url) FROM '${base_path}/tagData.csv' WITH csv;
COPY article (feed_url, guid, date, link, author, title, summary, description) FROM '${base_path}/articleData.csv' WITH csv;
