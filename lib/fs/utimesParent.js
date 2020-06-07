// adapted from https://github.com/mafintosh/tar-fs

var fs = require('fs');
var stripPath = require('../stripPath');

module.exports = function utimesParent(fullPath, entry, options, callback) {
  try {
    var now = options.now || new Date();
    var parentPath = fullPath.slice(0, -stripPath(entry.path, options).length - 1);
    fs.utimes(parentPath, now, entry.mtime, callback);
  } catch (err) {
    return callback(err);
  }
};
