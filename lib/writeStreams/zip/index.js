var path = require('path');
var writer = require('flush-write-stream');
var assign = require('object-assign');
var pumpify = require('pumpify');

// var FilePathTransform = require('./FilePathTransform');
var ZipTransform = require('../../transforms/Zip');
var EntryProgressTransform = require('../../transforms/EntryProgressTransform');
var tempFilename = require('../../tempFilename');

var TMP_DIR = path.join(require('osenv').home(), '.tmp');

module.exports = function createWriteZipStream(dest, decompressors, options) {
  options = assign({ now: new Date(), tempFilename: path.join(TMP_DIR, tempFilename('file.zip')) }, options);

  var transforms = decompressors.slice();
  transforms.push(new ZipTransform());
  !options.progress || transforms.push(new EntryProgressTransform(options));
  transforms.push(
    writer({ objectMode: true }, function write(entry, encoding, callback) {
      entry.create(dest, options, callback);
    })
  );
  return pumpify(transforms);
};
