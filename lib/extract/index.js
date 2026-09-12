var path = require('path');
var fs = require('fs');
var fsWriteStreamAtomic = require('fs-write-stream-atomic');

var atomicCallbackFn = require('../safe/atomicCallbackFn');
var extname = require('../completeExtname');
var hasExtension = require('../hasExtension');
var streamExtractors = require('./streamExtractors');
var responseProgress = require('../progress/responseProgress');
var zip = require('../zip');
var tar = require('../tar');

module.exports = function extract(src, dest, options, callback) {
  var filename = typeof src === 'string' ? path.basename(src) : src.filename || '';
  var extension = options.extension || extname(filename);
  if (!extension) return callback(new Error('Cannot determine extract type for ' + src));
  callback = atomicCallbackFn(dest, callback);

  var res = typeof src === 'string' ? fs.createReadStream(src) : src;
  var extractors = streamExtractors(extension, dest, options, res);
  for (var index = 0; index < extractors.length; index++) res = res.pipe(extractors[index]);

  if (hasExtension(extension, 'zip')) return zip(res, dest, options, callback);
  else if (hasExtension(extension, 'tar') || hasExtension(extension, 'tgz')) return tar(res, dest, options, callback);

  var entry = {
    basename: filename,
    fullPath: path.join(dest, filename),
  };
  responseProgress(res, src, entry, options, function (err, res) {
    if (err) return callback(err);
    if (!extractors.length) res = res.pipe(fsWriteStreamAtomic(entry.fullPath));
    res.on('error', callback);
    res.on('close', function () {
      callback(null, filename);
    });
  });
};
