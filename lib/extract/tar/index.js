var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp-classic');
var tarStream = require('tar-stream');
var once = require('once');
var Queue = require('queue-cb');

var createEntry = require('./createEntry');
var drainStream = require('../../drainStream');
var streamToBuffer = require('../../streamToBuffer');

module.exports = function extractTar(res, dest, options, callback) {
  var extract = tarStream.extract();
  var links = [];
  var files = [];

  extract.on('entry', function (header, stream, callback) {
    var entry = createEntry(header);

    var parts = entry.path.split(path.sep);
    if (options.strip > parts.length) callback(new Error('You cannot strip more levels than there are directories'));
    parts = parts.slice(options.strip);
    entry.path = parts.join(path.sep);
    entry.fullPath = path.join(dest, entry.path, entry.basename);

    if (header.type === 'directory') {
      mkdirp(entry.fullPath, function () {
        drainStream(stream, callback);
      });
    } else if (header.type === 'symlink' || header.type === 'link') {
      files.push(entry);
      drainStream(stream, callback);
    } else {
      callback = once(callback);
      stream = stream.pipe(fs.createWriteStream(entry.fullPath, { mode: entry.mode & ~process.umask() }));
      stream.on('error', callback);
      stream.on('close', function () {
        callback();
      });
    }
  });

  extract.on('finish', function () {
    // var now = new Date();

    files.map(function (file) {
      var targetPath = file.linkname ? path.join(dest, file.path, file.linkname) : null;
      if (file.type === 'file') fs.writeFileSync(file.fullPath, file.data);
      else if (file.type === 'link') fs.linkSync(targetPath, file.fullPath);
      else if (file.type === 'symlink') fs.symlinkSync(targetPath, file.fullPath);
    });

    callback();
  });
  extract.on('error', callback);
  res = res.pipe(extract);
  res.on('error', callback);
  res.on('close', function () {
    callback();
  });
};
