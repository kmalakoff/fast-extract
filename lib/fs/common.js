var fs = require('graceful-fs');

module.exports = function common(entry, now, callback) {
  fs.chmod(entry.fullPath, entry.mode, function (err) {
    if (err) return callback(err);
    fs.utimes(entry.fullPath, now, entry.mtime, callback);
  });
};
