var TarTransform = require('../transforms/Tar');
var EntryProgressTransform = require('../transforms/EntryProgress');
var createWriteEntriesStream = require('../writeStreams/entries');
var pipeline = require('../pipeline');

module.exports = function createTarPipeline(dest, decompressors, options) {
  var transforms = decompressors.slice();
  transforms.push(new TarTransform());
  !options.progress || transforms.push(new EntryProgressTransform(options));
  transforms.push(createWriteEntriesStream(dest, options));
  return pipeline(transforms);
};
