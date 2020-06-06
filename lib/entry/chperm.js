// adapted from https://github.com/mafintosh/tar-fs

var fs = require('fs');

var UMASK = process.umask ? process.umask() : 0;
var DMODE = parseInt(333, 8);
var FMODE = parseInt(222, 8);
var UID = process.getuid ? process.getuid() : -1;
var OWN = process.platform !== 'win32' && UID === 0;

module.exports = function chperm(fullPath, entry, callback) {
  return callback();
  var link = entry.type === 'symlink';

  // eslint-disable-next-line node/no-deprecated-api
  var chmod = link ? fs.lchmod : fs.chmod;
  if (!chmod) return callback();

  var mode = (entry.mode | (entry.type === 'directory' ? DMODE : FMODE)) & UMASK;
  chmod(fullPath, mode, function (err) {
    if (err) return callback(err);
    if (!OWN) return callback();

    var chown = link ? fs.lchown : fs.chown;
    if (!chown) return callback();
    chown(fullPath, entry.uid, entry.gid, callback);
  });
};
