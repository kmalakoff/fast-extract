var path = require('path');

var hasType = require('./hasType');
var decompressorsByType = require('./transforms/decompressorsByType');
var createWriteFileStream = require('./writeStreams/file');
var createWriteTarStream = require('./writeStreams/tar');
var createWriteZipStream = require('./writeStreams/zip');
var WriteFileTransform = require('./transforms/WriteFile');
var tempSuffix = require('./tempSuffix');

var TMP_DIR = path.join(require('osenv').home(), '.tmp');

module.exports = function extract(dest, options) {
  var type = options.type || '';
  var decompressors = decompressorsByType(type);

  if (hasType(type, 'zip')) {
    // zip requires a file path to write to a temporary file
    var tempPath = tempSuffix(path.join(TMP_DIR, 'file.zip'));
    decompressors.push(new WriteFileTransform({ tempPath: tempPath }));
    return createWriteZipStream(dest, decompressors, options);
  } else if (hasType(type, 'tar') || hasType(type, 'tgz')) {
    return createWriteTarStream(dest, decompressors, options);
  } else {
    return createWriteFileStream(dest, decompressors, options);
  }
};
