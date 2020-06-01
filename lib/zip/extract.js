if (typeof setimmediate === 'undefined') global.setImmediate = require('next-tick');
var stream = require('stream');
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

    var now = new Date();
    var queue = new Queue();
    var links = [];
    var progress = extractProgress(options);

    extract.on('entry', function (header) {
      queue.defer(function (callback) {
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
      extract.readEntry();
    });

    extract.on('close', function () {
      queue.await(function (err) {
        if (err) return callback(err);
        progress(null); // progress is done
        var linkQueue = new Queue();
        for (var index = 0; index < links.length; index++) linkQueue.defer(createLink.bind(null, links[index], now));
        linkQueue.await(callback);
      });
    });
    extract.on('error', callback);
    extract.readEntry();
  });
};
