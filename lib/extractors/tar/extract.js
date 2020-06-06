var tarStream = require('tar-stream');
var once = require('once');
var assign = require('object-assign');
var Queue = require('queue-cb');
var eos = require('end-of-stream');

var createEntry = require('./createEntry');
var extractProgress = require('../../progress/extractProgress');

var CONCURRENCY = 10;

module.exports = function extractTar(src, dest, options, callback) {
  var extract = tarStream.extract();

  callback = once(callback);
  options = assign({ now: new Date() }, options);
  var links = [];
  var progress = extractProgress(options);

  extract.on('entry', function (header, stream, callback) {
    var _callback = callback;
    callback = function (err) {
      _callback(err);
    };

    createEntry(header, stream, function (err, entry) {
      if (err) return callback(err);
      !progress || progress(entry);

      if (entry.type === 'link' || entry.type === 'symlink') {
        links.push(entry);
        return callback();
      }
      entry.create(dest, options, callback);
    });
  });

  src = src.pipe(extract);
  eos(src, function (err) {
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
};
