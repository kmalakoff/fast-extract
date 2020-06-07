// adapted from https://github.com/mafintosh/tar-fs

var fs = require('fs');

module.exports = function utimes(entry, now, callback) {
  if (!now) return callback(new Error('Missing now'));
  fs.utimes(entry.fullPath, now, entry.mtime, callback);
};
