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
    if (typeof src === 'string') {
      out = createWriteZipStream(dest, decompressors, options);
      eos(out, callback);
      out.write(src, 'utf8');
      return out.end();
    }

    // zip requires a file path to write to a temporary file
    else {
      var tempPath = tempSuffix(path.join(TMP_DIR, 'file.zip'));
      callback = atomicCallbackFn(tempPath, true, callback);
      decompressors.push(new WriteFileTransform({ tempPath: tempPath }));
      out = createWriteZipStream(dest, decompressors, options);
    }
  } else if (hasType(type, 'tar') || hasType(type, 'tgz')) {
    out = createWriteTarStream(dest, decompressors, options);
  } else {
    out = createWriteFileStream(dest, decompressors, assign({ basename: basename }, options));
  }

  var res = typeof src === 'string' ? fs.createReadStream(src) : src;
  res = res.pipe(out);
  eos(res, callback);
};
