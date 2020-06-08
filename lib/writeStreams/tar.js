var pumpify = require('pumpify');

var TarTransform = require('../transforms/Tar');
var EntryProgressTransform = require('../transforms/EntryProgress');
var createWriteEntriesStream = require('./lib/entries');

module.exports = function createWriteTarStream(dest, decompressors, options) {
  var transforms = decompressors.slice();
  transforms.push(new TarTransform());
  !options.progress || transforms.push(new EntryProgressTransform(options));
  transforms.push(createWriteEntriesStream(dest, options));
  return pumpify(transforms);
};
