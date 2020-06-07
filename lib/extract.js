var path = require('path');
var fs = require('fs');
var pumpify = require('pumpify');
var eos = require('end-of-stream');
var assign = require('object-assign');

var atomicCallbackFn = require('./safe/atomicCallbackFn');
var extname = require('./completeExtname');
var hasType = require('./hasType');
var createTransforms = require('./extractors/createTransforms');
var createWriteFileStream = require('./extractors/file/createWriteStream');
var createWriteTarStream = require('./extractors/tar/createWriteStream');
var createWriteZipStream = require('./extractors/zip/createWriteStream');

module.exports = function extract(src, dest, options, callback) {
  callback = atomicCallbackFn(dest, callback);

  var basename = typeof src === 'string' ? path.basename(src) : src.basename || src.filename || '';
  var type = options.type || extname(basename);
  var transforms = createTransforms(type);
  var res = typeof src === 'string' ? fs.createReadStream(src) : src;

  if (hasType(type, 'tar') || hasType(type, 'tgz')) {
    var out = createWriteTarStream(dest, transforms, options);
    res = res.pipe(out);
    return eos(res, callback);
  }
  if (hasType(type, 'zip')) {
    var out = createWriteZipStream(dest, transforms, options);
    res = res.pipe(out);
    return eos(res, callback);
  }

  options = assign({ basename: basename }, options);
  var out = createWriteFileStream(dest, transforms, options);
  res = res.pipe(out);
  return eos(res, callback);
};
