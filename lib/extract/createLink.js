var path = require('path');
var fs = require('graceful-fs');
var mkpath = require('mkpath');

module.exports = function createLink(entry, dest, options, callback) {
  fs.unlink(entry.fullPath, function () {
    var targetPath = path.join(dest, entry.path, entry.linkname);
    mkpath(path.dirname(targetPath), function () {
      var link = entry.type === 'symlink' ? fs.symlink : fs.link;
      link(targetPath, entry.fullPath, function (err) {
        if (err) return callback(err);
        fs.utimes(entry.fullPath, options.now, entry.mtime, callback);
      });
    });
  });
};
