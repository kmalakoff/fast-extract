var yauzl = require('yauzl');
var once = require('once');
var Queue = require('queue-cb');

var createDirectory = require('../extract/createDirectory');
var createFile = require('../extract/createFile');
var createLink = require('../extract/createLink');
var createEntry = require('./createEntry');
var extractProgress = require('../progress/extractProgress');

module.exports = function extract(src, dest, options, callback) {
  yauzl.open(src, { lazyEntries: true }, function (err, extract) {
    if (err) return callback(err);
    callback = once(callback);

    var now = new Date();
    var links = [];
    var progress = extractProgress(options);

    var error = null;
    extract.on('entry', function (header) {
      function callback(err) {
        if (err) error = err;
        extract.readEntry();
      }
      createEntry(header, dest, extract, options, function (err, entry) {
        if (err) return callback(err);
        !progress || progress(entry);

        switch (entry.type) {
          case 'directory':
            return createDirectory(entry, now, callback);
          case 'symlink':
          case 'link':
            links.push(entry);
            return callback();
          case 'file':
            return extract.openReadStream(header, function (err, stream) {
              if (err) return callback(err);
              createFile(entry, stream, now, callback);
            });
          default:
            return callback();
        }
      });
    });

    extract.on('close', function () {
      if (error) return callback(error);
      progress(null); // progress is done
      var queue = new Queue();
      for (var index = 0; index < links.length; index++) queue.defer(createLink.bind(null, links[index], now));
      queue.await(callback);
    });
    extract.on('error', callback);
    extract.readEntry();
  });
};
