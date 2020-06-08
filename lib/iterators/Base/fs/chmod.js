// adapted from https://github.com/mafintosh/tar-fs

var fs = require('fs');

var UMASK = process.umask ? process.umask() : 0;
var DMODE = parseInt(333, 8);
var FMODE = parseInt(222, 8);

module.exports = function chmodFn(entry, options, callback) {
  // eslint-disable-next-line node/no-deprecated-api
  var chmod = entry.type === 'symlink' ? fs.lchmod : fs.chmod;
  if (!chmod || UMASK === null) return callback();

  var mode = (entry.mode | (entry.type === 'directory' ? DMODE : FMODE)) & ~UMASK;
  chmod(entry.fullPath, mode, callback);
};
