// adapted from https://github.com/mafintosh/tar-fs

var fs = require('fs');

var UID = process.getuid ? process.getuid() : -1;
var OWN = process.platform !== 'win32' && UID === 0;

module.exports = function chownFn(entry, callback) {
  var chown = entry.type === 'symlink' ? fs.lchown : fs.chown;
  if (!chown || !OWN || !entry.uid || !entry.gid) return callback();
  chown(entry.fullPath, entry.uid, entry.gid, callback);
};
