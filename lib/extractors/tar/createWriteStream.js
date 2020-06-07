var writer = require('flush-write-stream');
var assign = require('object-assign');
var pumpify = require('pumpify');

var extractProgress = require('../../progress/extractProgress');
var TarStream = require('./Stream');

module.exports = function createWriteFileStream(dest, transforms, options) {
  options = assign({ now: new Date() }, options, { progress: extractProgress(options) });
  transforms = transforms.concat([
    new TarStream(options),
    writer({ objectMode: true }, function write(entry, enc, callback) {
      entry.create(dest, options, callback);
    }),
  ]);
  return pumpify(transforms);
};
