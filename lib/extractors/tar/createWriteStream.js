var writer = require('flush-write-stream');
var assign = require('object-assign');
var pumpify = require('pumpify');

var TarTransform = require('./Transform');
var EntryProgressTransform = require('../../transforms/EntryProgress');

module.exports = function createWriteFileStream(dest, transforms, options) {
  options = assign({ now: new Date() }, options);
  transforms.push(new TarTransform());
  !options.progress || transforms.push(new EntryProgressTransform(options));
  transforms.push(
    writer({ objectMode: true }, function write(entry, encoding, callback) {
      entry.create(dest, options, callback);
    })
  );
  return pumpify(transforms);
};
