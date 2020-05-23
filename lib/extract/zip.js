var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp-classic');
var DecompressZip = require('decompress-zip');
var tempFilename = require('../tempFilename');
var atomicCallbackFn = require('../atomicCallbackFn');

var TMP_DIR = path.join(require('osenv').home(), '.tmp');

module.exports = function extractZip(res, dest, options, callback) {
  var tempSrc = path.join(TMP_DIR, tempFilename(), 'file');
  mkdirp(path.dirname(tempSrc), function () {
    callback = atomicCallbackFn(path.dirname(tempSrc), false, callback);
    res = res.pipe(fs.createWriteStream(tempSrc));
    res.on('error', callback);
    res.on('close', function () {
      var zip = new DecompressZip(tempSrc);
      // zip.on('progress', function (i, numFiles) {});
      zip.on('extract', function () {
        callback();
      });
      zip.on('error', callback);
      zip.extract({
        path: dest,
        strip: options.strip || 0,
        filter: function (file) {
          return file.type !== 'Directory';
        },
      });
    });
  });
};
