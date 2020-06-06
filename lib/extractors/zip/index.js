var path = require('path');
var fs = require('fs');
var mkpath = require('mkpath');
var eos = require('end-of-stream');

var extract = require('./extract');

var atomicCallbackFn = require('../../safe/atomicCallbackFn');
var tempFilename = require('../../tempFilename');

var TMP_DIR = path.join(require('osenv').home(), '.tmp');

module.exports = function extractZip(res, dest, options, callback) {
  var tempSrc = path.join(TMP_DIR, tempFilename('file.zip'));
  mkpath(path.dirname(tempSrc), function () {
    callback = atomicCallbackFn(path.dirname(tempSrc), false, callback);
    res = res.pipe(fs.createWriteStream(tempSrc));
    eos(res, function (err) {
      err ? callback(err) : extract(tempSrc, dest, options, callback);
    });
  });
};
