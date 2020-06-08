var path = require('path');

var hasType = require('./hasType');
var decompressorsByType = require('./transforms/decompressorsByType');
var createFilePipeline = require('./pipelines/file');
var createTarPipeline = require('./pipelines/tar');
var createZipPipeline = require('./pipelines/zip');
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
    return createZipPipeline(dest, decompressors, options);
  } else if (hasType(type, 'tar') || hasType(type, 'tgz')) {
    return createTarPipeline(dest, decompressors, options);
  } else {
    return createFilePipeline(dest, decompressors, options);
  }
};
