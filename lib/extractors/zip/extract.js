var yauzl = require('yauzl');
var once = require('once');
var assign = require('object-assign');
var Queue = require('queue-cb');
var eos = require('end-of-stream');

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

    var errored = false;
    extract.on('entry', function (header) {
      function callback(err) {
        if (err) {
          if (!errored) {
            errored = true;
            extract.emit('error', err);
          }
        }
        extract.readEntry();
      }
      if (errored) return callback();

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

    eos(extract, function (err) {
      if (err) {
        progress(null); // progress is done
        return callback(err);
      }

      var queue = new Queue(CONCURRENCY);
      for (var index = 0; index < links.length; index++) {
        (function (entry) {
          queue.defer(function (callback) {
            entry.create(dest, options, function (err) {
              callback(err);
            });
          });
        })(links[index]);
      }
      queue.await(function (err) {
        progress(null); // progress is done
        callback(err);
      });
    });
    extract.readEntry();
  });
};
