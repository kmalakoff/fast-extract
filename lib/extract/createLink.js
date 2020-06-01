var path = require('path');
var fs = require('graceful-fs');
var mkpath = require('mkpath');

module.exports = function createLink(entry, options, callback) {
  fs.unlink(entry.fullPath, function () {
    mkpath(path.dirname(entry.targetPath), function () {
      var link = entry.type === 'symlink' ? fs.symlink : fs.link;
      link(entry.targetPath, entry.fullPath, function (err) {
        if (err) return callback(err);
        fs.utimes(entry.fullPath, options.now, entry.mtime, callback);
      });
    });
  });
};
