// adapted from https://github.com/mafintosh/tar-fs

var path = require('path');
var fs = require('fs');

function utimesParent(fullPath, entry, options, callback) {
  return callback();
  var now = options.now || new Date();
  var paths = fullPath.split(path.sep);
  if (paths.length <= 1) return callback();
  fs.utimes(paths[0], now, entry.mtime, callback);
}

module.exports = function utimes(fullPath, entry, options, callback) {
  return callback();
  var now = options.now || new Date();
  if (entry.type === 'directory') return fs.utimes(fullPath, now, entry.mtime, callback);
  if (entry.type === 'symlink') return utimesParent(fullPath, callback);

  fs.utimes(fullPath, now, entry.mtime, function (err) {
    if (err) return callback(err);
    utimesParent(fullPath, callback);
  });
};
