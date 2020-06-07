// adapted from https://github.com/mafintosh/tar-fs

var fs = require('fs');

module.exports = function utimes(entry, options, callback) {
  if (!options.now) return callback(new Error('Options are missing now'));
  fs.utimes(entry.fullPath, options.now, entry.mtime, callback);
};
