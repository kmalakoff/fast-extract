var writer = require('flush-write-stream');
var assign = require('object-assign');
var pumpify = require('pumpify');

var TarTransform = require('../transforms/Tar');
var EntryProgressTransform = require('../transforms/EntryProgressTransform');

module.exports = function createWriteTarStream(dest, decompressors, options) {
  options = assign({ now: new Date() }, options);

  var transforms = decompressors.slice();
  transforms.push(new TarTransform());
  !options.progress || transforms.push(new EntryProgressTransform(options));
  transforms.push(
    writer({ objectMode: true }, function write(entry, encoding, callback) {
      entry.create(dest, options, callback);
    })
  );
  return pumpify(transforms);
};
