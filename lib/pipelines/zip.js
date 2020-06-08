var ZipTransform = require('../transforms/Zip');
var EntryProgressTransform = require('../transforms/EntryProgress');
var createWriteEntriesStream = require('../writeStreams/entries');
var pipeline = require('../pipeline');

module.exports = function createZipPipeline(dest, decompressors, options) {
  var transforms = decompressors.slice();
  transforms.push(new ZipTransform());
  !options.progress || transforms.push(new EntryProgressTransform(options));
  transforms.push(createWriteEntriesStream(dest, options));
  return pipeline(transforms);
};
