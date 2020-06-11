var path = require('path');

var EntryProgressTransform = require('../transforms/EntryProgress');
var PathToData = require('../transforms/PathToData');
var WriteFileTransform = require('../transforms/WriteFile');
var ZipTransform = require('../transforms/Zip');
var createWriteEntriesStream = require('../write/entries');
var tempSuffix = require('../../tempSuffix');

var TMP_DIR = path.join(require('osenv').home(), '.tmp');

module.exports = function createZipPipeline(dest, streams, options) {
  var isPath = typeof options.source === 'string';
  streams = streams.slice();
  if (isPath) {
    if (streams.length) {
      streams.unshift(new PathToData());
      streams.push(new WriteFileTransform({ tempPath: tempSuffix(path.join(TMP_DIR, 'file.zip')) }));
    }
  } else {
    streams.push(new WriteFileTransform({ tempPath: tempSuffix(path.join(TMP_DIR, 'file.zip')) }));
  }
  streams.push(new ZipTransform());
  !options.progress || streams.push(new EntryProgressTransform(options));
  streams.push(createWriteEntriesStream(dest, options));
  return streams;
};
