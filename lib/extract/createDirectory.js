var fs = require('graceful-fs');
var mkpath = require('mkpath');
var drainStream = require('../drainStream');

module.exports = function createDirectory(entry, stream, options, callback) {
  mkpath(entry.fullPath, function () {
    fs.chmod(entry.fullPath, entry.mode, function (err) {
      if (err) return callback(err);

      fs.utimes(entry.fullPath, options.now, entry.mtime, function (err) {
        err ? callback(err) : drainStream(stream, callback);
      });
    });
  });
};
