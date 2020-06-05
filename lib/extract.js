var path = require('path');
var fs = require('fs');

var atomicCallbackFn = require('./safe/atomicCallbackFn');
var extname = require('./completeExtname');
var hasExtension = require('./hasExtension');
var streamExtractors = require('./streamExtractors');
var tar = require('./tar');
var zip = require('./zip');
var writeFile = require('./writeFile');

module.exports = function extract(src, dest, options, callback) {
  var basename = typeof src === 'string' ? path.basename(src) : src.basename || src.filename || '';
  var extension = options.extension || extname(basename);
  if (!extension) return callback(new Error('Cannot determine extract type for ' + src));
  callback = atomicCallbackFn(dest, callback);

  var res = typeof src === 'string' ? fs.createReadStream(src) : src;
  var extractors = streamExtractors(extension, dest, options, res);
  for (var index = 0; index < extractors.length; index++) res = res.pipe(extractors[index]);

  if (hasExtension(extension, 'tar') || hasExtension(extension, 'tgz')) return tar(res, dest, options, callback);
  if (hasExtension(extension, 'zip')) return zip(res, dest, options, callback);
  return writeFile(res, src, dest, options, callback);
};
