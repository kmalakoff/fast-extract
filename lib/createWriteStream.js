var path = require('path');
var fs = require('fs');
var pumpify = require('pumpify');

var atomicCallbackFn = require('./safe/atomicCallbackFn');
var extname = require('./completeExtname');
var hasType = require('./hasType');
var transforms = require('./extractors/transforms');
var tar = require('./extractors/tar');
var zip = require('./extractors/zip');
var file = require('./extractors/file');

module.exports = function extract(src, dest, options, callback) {
  var basename = typeof src === 'string' ? path.basename(src) : src.basename || src.filename || '';
  var type = options.type || extname(basename);
  if (!type) return callback(new Error('Cannot determine extract type for ' + src));
  callback = atomicCallbackFn(dest, callback);

  var res = typeof src === 'string' ? fs.createReadStream(src) : src;
  var extractors = transforms(type, dest, options, res);
  if (extractors.length) res = pumpify([res].concat(extractors));

  if (hasType(type, 'tar') || hasType(type, 'tgz')) return tar(res, dest, options, callback);
  if (hasType(type, 'zip')) return zip(res, dest, options, callback);
  return file(res, src, dest, options, callback);
};
