var path = require('path');
var fs = require('fs');
var fsWriteStreamAtomic = require('fs-write-stream-atomic');

var atomicCallbackFn = require('../atomicCallbackFn');
var extname = require('../completeExtname');
var zip = require('./zip');
var tar = require('./tar');
var streamExtractors = require('../streamExtractors');

// shim
if (typeof Buffer.from === 'undefined')
  Buffer.from = function (data) {
    // eslint-disable-next-line node/no-deprecated-api
    return new Buffer(data);
  };

module.exports = function extract(src, dest, options, callback) {
  var filename = options.filename || src;
  var extension = options.extension || extname(filename);
  if (!extension) return callback(new Error('Cannot determine extract type for ' + src));
  if (extension[0] === '.') extension = extension.slice(1);
  callback = atomicCallbackFn(dest, callback);

  var res = typeof src === 'string' ? fs.createReadStream(src) : src;
  var extractors = streamExtractors(extension, dest, options, res);
  for (var index = 0; index < extractors.length; index++) res = res.pipe(extractors[index]);

  if (extension === 'zip')
    zip(res, dest, options, function (err) {
      err ? callback(err) : callback(null, filename);
    });
  else if (~extension.indexOf('tar') || ~extension.indexOf('tgz'))
    tar(res, dest, options, function (err) {
      err ? callback(err) : callback(null, filename);
    });
  else {
    if (!extractors.length) res = res.pipe(fsWriteStreamAtomic(path.join(dest, filename)));
    res.on('error', callback);
    res.on('close', function () {
      callback(null, filename);
    });
  }
};
