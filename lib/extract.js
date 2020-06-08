var path = require('path');
var fs = require('fs');
var eos = require('end-of-stream');
var assign = require('object-assign');

var atomicCallbackFn = require('./safe/atomicCallbackFn');
var extname = require('./completeExtname');
var hasType = require('./hasType');
var decompressorsByType = require('./transforms/decompressorsByType');
var createFilePipeline = require('./pipelines/file');
var createTarPipeline = require('./pipelines/tar');
var createZipPipeline = require('./pipelines/zip');
var WriteFileTransform = require('./transforms/WriteFile');
var tempSuffix = require('./tempSuffix');

var TMP_DIR = path.join(require('osenv').home(), '.tmp');

module.exports = function extract(src, dest, options, callback) {
  callback = atomicCallbackFn(dest, callback);

  var basename = typeof src === 'string' ? path.basename(src) : src.basename || src.filename || '';
  var type = options.type || extname(basename);
  var decompressors = decompressorsByType(type);
  var out = null;

  if (hasType(type, 'zip')) {
    // zip already a file path
    out = createZipPipeline(dest, decompressors, options);
    if (typeof src === 'string') {
      eos(out, callback);
      out.write(src, 'utf8');
      return out.end();
    }

    // zip requires a file path to write to a temporary file
    else {
      // callback = atomicCallbackFn(tempPath, true, callback);
      decompressors.push(new WriteFileTransform({ tempPath: tempSuffix(path.join(TMP_DIR, 'file.zip')) }));
      out = createZipPipeline(dest, decompressors, options);
    }
  } else if (hasType(type, 'tar') || hasType(type, 'tgz')) {
    out = createTarPipeline(dest, decompressors, options);
  } else {
    out = createFilePipeline(dest, decompressors, assign({ basename: basename }, options));
  }

  var res = typeof src === 'string' ? fs.createReadStream(src) : src;
  res = res.pipe(out);
  eos(res, callback);
};
