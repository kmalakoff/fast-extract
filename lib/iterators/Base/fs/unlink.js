// adapted from https://github.com/npm/node-tar/blob/master/lib/unpack.js

var fs = require('fs');
var crypto = require('crypto');

module.exports = function unlink(fullPath, callback) {
  if (process.platform !== 'win32') return fs.unlink(fullPath, callback);

  var tempFullPath = fullPath + '.DELETE.' + crypto.randomBytes(16).toString('hex');
  fs.rename(fullPath, tempFullPath, function (err) {
    err ? callback(err) : fs.unlink(tempFullPath, callback);
  });
};
