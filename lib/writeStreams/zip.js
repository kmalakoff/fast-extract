var pumpify = require('pumpify');

var ZipTransform = require('../transforms/Zip');
var EntryProgressTransform = require('../transforms/EntryProgress');
var createWriteEntriesStream = require('./entries');

module.exports = function createWriteZipStream(dest, decompressors, options) {
  var transforms = decompressors.slice();
  transforms.push(new ZipTransform());
  !options.progress || transforms.push(new EntryProgressTransform(options));
  transforms.push(createWriteEntriesStream(dest, options));
  return pumpify(transforms);
};
