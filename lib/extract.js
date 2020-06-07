var path = require('path');
var fs = require('fs');
var eos = require('end-of-stream');
var assign = require('object-assign');

var atomicCallbackFn = require('./safe/atomicCallbackFn');
var extname = require('./completeExtname');
var hasType = require('./hasType');
var decompressorsByType = require('./transforms/decompressorsByType');
var createWriteFileStream = require('./writeStreams/file');
var createWriteTarStream = require('./writeStreams/tar');
var createWriteZipStream = require('./writeStreams/zip');

module.exports = function extract(src, dest, options, callback) {
  callback = atomicCallbackFn(dest, callback);

  var basename = typeof src === 'string' ? path.basename(src) : src.basename || src.filename || '';
  var type = options.type || extname(basename);
  var decompressors = decompressorsByType(type);
  var out = null;
  if (hasType(type, 'tar') || hasType(type, 'tgz')) out = createWriteTarStream(dest, decompressors, options);
  else if (hasType(type, 'zip')) out = createWriteZipStream(dest, decompressors, options);
  else out = createWriteFileStream(dest, decompressors, assign({ basename: basename }, options));

  var res = typeof src === 'string' ? fs.createReadStream(src) : src;
  res = res.pipe(out);
  return eos(res, callback);
};
