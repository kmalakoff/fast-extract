var tarStream = require('tar-stream');
var once = require('once');
var Queue = require('queue-cb');

var createDirectory = require('../fs/createDirectory');
var createFile = require('../fs/createFile');
var createLink = require('../fs/createLink');
var createEntry = require('./createEntry');
var extractProgress = require('../progress/extractProgress');

var CONCURRENCY = 10;

module.exports = function extractTar(src, dest, options, callback) {
  var extract = tarStream.extract();
  callback = once(callback);

  var now = new Date();
  var links = [];
  var progress = extractProgress(options);

  extract.on('entry', function (header, stream, callback) {
    createEntry(header, dest, extract, options, function (err, entry) {
      if (err) return callback(err);
      !progress || progress(entry);

      switch (entry.type) {
        case 'directory':
          stream.resume(); // drain stream
          return createDirectory(entry, now, callback);
        case 'symlink':
        case 'link':
          stream.resume(); // drain stream
          links.push(entry);
          return callback();
        case 'file':
          return createFile(entry, stream, now, callback);
        default:
          stream.resume(); // drain stream
          return callback();
      }
    });
  });

  extract.on('finish', function () {
    progress(null); // progress is done
    var queue = new Queue(CONCURRENCY);
    for (var index = 0; index < links.length; index++) queue.defer(createLink.bind(null, links[index], now));
    queue.await(callback);
  });
  extract.on('error', callback);

  src = src.pipe(extract);
  src.on('error', callback);
  src.on('close', function () {
    callback();
  });
};
