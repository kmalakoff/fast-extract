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
  var files = [];

  extract.on('entry', function (header, stream, callback) {
    try {
      var entry = createEntry(header, dest, options);
      streamToBuffer(stream, function (err, buffer) {
        if (err) return callback(err);
        entry.data = buffer;
        files.push(entry);
        callback();
      });
    } catch (err) {
      return callback(err);
    }
  });

  extract.on('finish', function () {
    // var now = new Date();

    // console.log('files', files);
    files.map(function (file) {
      // var mode = file.mode & ~process.umask();

      var targetPath = file.linkname ? path.join(dest, file.path, file.linkname) : null;
      if (file.type === 'directory') mkdirp.sync(file.fullPath);
      else if (file.type === 'file') fs.writeFileSync(file.fullPath, file.data);
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
