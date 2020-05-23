var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp-classic');
var tarStream = require('tar-stream');
var once = require('once');
var Queue = require('queue-cb');

var createEntry = require('./createEntry');
var drainStream = require('../../drainStream');

module.exports = function extractTar(res, dest, options, callback) {
  var extract = tarStream.extract();
  var now = new Date();
  var links = [];

  extract.on('entry', function (header, stream, callback) {
    var entry = createEntry(header);

    var parts = entry.path.split(path.sep);
    if (options.strip > parts.length) callback(new Error('You cannot strip more levels than there are directories'));
    parts = parts.slice(options.strip);
    entry.path = parts.join(path.sep);
    entry.fullPath = path.join(dest, entry.path, entry.basename);

    if (header.type === 'directory') {
      mkdirp(entry.fullPath, function () {
        fs.utimes(entry.fullPath, now, entry.mtime, function (err) {
          err ? callback(err) : drainStream(stream, callback);
        });
      });
    } else if (header.type === 'symlink' || header.type === 'entry') {
      links.push(entry);
      drainStream(stream, callback);
    } else {
      callback = once(callback);
      stream = stream.pipe(fs.createWriteStream(entry.fullPath, { mode: entry.mode & ~process.umask() }));
      stream.on('error', callback);
      stream.on('close', function () {
        fs.utimes(entry.fullPath, now, entry.mtime, callback);
      });
    }
  });

  extract.on('finish', function () {
    if (!links.length) return callback();
    var queue = new Queue();
    for (var index = 0; index < links.length; index++) {
      var entry = links[index];
      var targetPath = entry.linkname ? path.join(dest, entry.path, entry.linkname) : null;

      if (entry.type === 'entry') queue.defer(fs.link.bind(null, targetPath, entry.fullPath));
      else queue.defer(fs.symlink.bind(null, targetPath, entry.fullPath));
      queue.await(callback);
    }
  });
  extract.on('error', callback);
  res = res.pipe(extract);
  res.on('error', callback);
  res.on('close', function () {
    callback();
  });
};
