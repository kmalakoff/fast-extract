var fs = require('graceful-fs');
var mkpath = require('mkpath');

module.exports = function createDirectory(entry, options, callback) {
  mkpath(entry.fullPath, function () {
    fs.chmod(entry.fullPath, entry.mode, function (err) {
      if (err) return callback(err);
      fs.utimes(entry.fullPath, options.now, entry.mtime, callback);
    });
  });
};
