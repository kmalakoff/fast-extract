var tarStream = require('tar-stream');
var once = require('once');
var Queue = require('queue-cb');

var createDirectory = require('../extract/createDirectory');
var createFile = require('../extract/createFile');
var createLink = require('../extract/createLink');
var createEntry = require('./createEntry');
var drainStream = require('../drainStream');
var extractProgress = require('../progress/extractProgress');

module.exports = function extractTar(res, dest, options, callback) {
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
          return drainStream(stream, function (err) {
            if (err) return callback(err);
            createDirectory(entry, now, callback);
          });
        case 'symlink':
        case 'link':
          return drainStream(stream, function (err) {
            if (err) return callback(err);
            links.push(entry);
            return callback();
          });
        case 'file':
          return createFile(entry, stream, now, callback);
        default:
          return drainStream(stream, callback);
      }
    });
  });

  extract.on('finish', function () {
    progress(null); // progress is done
    var queue = new Queue();
    for (var index = 0; index < links.length; index++) queue.defer(createLink.bind(null, links[index], now));
    queue.await(callback);
  });
  extract.on('error', callback);

  res = res.pipe(extract);
  res.on('error', callback);
  res.on('close', function () {
    callback();
  });
};
