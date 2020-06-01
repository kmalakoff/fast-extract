var tarStream = require('tar-stream');

var assign = require('object-assign');
var Queue = require('queue-cb');
var once = require('once');

var createDirectory = require('../extract/createDirectory');
var createFile = require('../extract/createFile');
var createLink = require('../extract/createLink');
var createEntry = require('./createEntry');
var extractProgress = require('../progress/extractProgress');

module.exports = function extractTar(res, dest, options, callback) {
  var extract = tarStream.extract();
  callback = once(callback);

  var links = [];
  var progress = extractProgress(options);
  options = assign({ now: new Date() }, options);

  extract.on('entry', function (header, stream, callback) {
    createEntry(header, dest, extract, options, function (err, entry) {
      if (err) return callback(err);
      !progress || progress(entry);

      if (entry.type === 'directory') createDirectory(entry, options, callback);
      else if (entry.type === 'symlink' || entry.type === 'link') {
        links.push(entry);
        callback();
      } else if (entry.type === 'file') createFile(entry, stream, options, callback);
      else callback();
    });
  });

  extract.on('finish', function () {
    progress(null); // progress is done
    var queue = new Queue();
    for (var index = 0; index < links.length; index++) queue.defer(createLink.bind(null, links[index], options));
    queue.await(callback);
  });
  extract.on('error', callback);

  res = res.pipe(extract);
  res.on('error', callback);
  res.on('close', function () {
    callback();
  });
};
