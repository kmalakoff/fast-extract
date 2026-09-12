var path = require('path');
var fs = require('graceful-fs');
var mkpath = require('mkpath');

module.exports = function createLink(entry, now, callback) {
  fs.unlink(entry.fullPath, function () {
    mkpath(path.dirname(entry.targetPath), function () {
      fs[entry.type](entry.targetPath, entry.fullPath, function (err) {
        if (err) return callback(err);
        fs.utimes(entry.fullPath, now, entry.mtime, callback);
      });
    });
  });
};
