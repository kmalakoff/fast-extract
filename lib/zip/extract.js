var stream = require('stream');
if (typeof setimmediate === 'undefined') global.setImmediate = require('next-tick');
if (!stream.Readable) {
  var legacyStream = require('readable-stream');
  stream.Readable = legacyStream.Readable;
  stream.Writable = legacyStream.Writable;
  stream.Transform = legacyStream.Transform;
  stream.PassThrough = legacyStream.PassThrough;
}
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

    var error = null;
    var now = new Date();
    var links = [];
    var progress = extractProgress(options);

    extract.on('entry', function (header) {
      var callback = once(function (err) {
        if (err) error = err;
        extract.readEntry();
      });
      if (error) return callback();

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
      progress(null); // progress is done
      if (error) return callback(error);
      var queue = new Queue();
      for (var index = 0; index < links.length; index++) queue.defer(createLink.bind(null, links[index], now));
      queue.await(callback);
    });
    extract.on('error', callback);
    extract.readEntry();
  });
};
