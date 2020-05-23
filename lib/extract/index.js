var path = require('path');
var fs = require('fs');
var fsWriteStreamAtomic = require('fs-write-stream-atomic');

var addProgress = require('./addProgress');
var atomicCallbackFn = require('../atomicCallbackFn');
var extname = require('../completeExtname');
var zip = require('./zip');
var tar = require('./tar');
var streamExtractors = require('../streamExtractors');

module.exports = function extract(src, dest, options, callback) {
  var filename = path.basename(options.filename || src);
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
    var entry = {
      basename: filename,
      fullPath: path.join(dest, filename),
    };
    addProgress(res, src, entry, options, function (err, res) {
      if (err) return callback(err);
      if (!extractors.length) res = res.pipe(fsWriteStreamAtomic(entry.fullPath));
      res.on('error', callback);
      res.on('close', function () {
        callback(null, filename);
      });
    });
  }
};
