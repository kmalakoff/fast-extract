// adapted from https://github.com/mafintosh/tar-fs

var fs = require('fs');

var utimesParent = require('./utimesParent');

module.exports = function utimes(fullPath, entry, options, callback) {
  var now = options.now || new Date();
  if (entry.type === 'directory') return fs.utimes(fullPath, now, entry.mtime, callback);
  if (entry.type === 'symlink') return utimesParent(fullPath, entry, options, callback);

  fs.utimes(fullPath, now, entry.mtime, function (err) {
    if (err) return callback(err);
    utimesParent(fullPath, entry, options, callback);
  });
};
