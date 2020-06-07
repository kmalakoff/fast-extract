var pumpify = require('pumpify');

var TarTransform = require('../transforms/Tar');
var EntryProgressTransform = require('../transforms/EntryProgressTransform');
var createWriteEntriesStream = require('./entries');

module.exports = function createWriteTarStream(dest, decompressors, options) {
  var transforms = decompressors.slice();
  transforms.push(new TarTransform());
  !options.progress || transforms.push(new EntryProgressTransform(options));
  transforms.push(createWriteEntriesStream(dest, options));
  return pumpify(transforms);
};
