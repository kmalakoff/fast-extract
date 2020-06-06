var yauzl = require('yauzl');
var once = require('once');
var assign = require('object-assign');
var Queue = require('queue-cb');

var createEntry = require('./createEntry');
var extractProgress = require('../../progress/extractProgress');

var CONCURRENCY = 10;

module.exports = function extract(src, dest, options, callback) {
  yauzl.open(src, { lazyEntries: true }, function (err, extract) {
    if (err) return callback(err);

    callback = once(callback);
    options = assign({ now: new Date() }, options);
    var links = [];
    var progress = extractProgress(options);

    var error = null;
    extract.on('entry', function (header) {
      function callback(err) {
        if (err) error = err;
        extract.readEntry();
      }

      createEntry(header, extract, function (err, entry) {
        if (err) return callback(err);
        !progress || progress(entry);

        if (entry.type === 'link' || entry.type === 'symlink') {
          links.push(entry);
          return callback();
        }
        entry.create(dest, options, callback);
      });
    });

    extract.on('close', function () {
      if (error) {
        progress(null); // progress is done
        return callback(error);
      }

      var queue = new Queue(CONCURRENCY);
      for (var index = 0; index < links.length; index++) {
        var entry = links[index];
        queue.defer(entry.create.bind(entry, dest, options));
      }
      queue.await(function (err) {
        progress(null); // progress is done
        callback(err);
      });
    });
    extract.on('error', callback);
    extract.readEntry();
  });
};
