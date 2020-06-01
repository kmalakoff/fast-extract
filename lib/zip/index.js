var path = require('path');
var fs = require('fs');
var mkpath = require('mkpath');

var extract = require('./extract');

var atomicCallbackFn = require('../safe/atomicCallbackFn');
var tempFilename = require('../tempFilename');

var TMP_DIR = path.join(require('osenv').home(), '.tmp');

module.exports = function extractZip(res, dest, options, callback) {
  var tempSrc = path.join(TMP_DIR, tempFilename('file.zip'));
  mkpath(path.dirname(tempSrc), function () {
    callback = atomicCallbackFn(path.dirname(tempSrc), false, callback);
    res = res.pipe(fs.createWriteStream(tempSrc));
    res.on('error', callback);
    res.on('close', function () {
      extract(tempSrc, dest, options, callback);
    });
  });
};
