var path = require('path');
var assign = require('object-assign');
var pumpify = require('pumpify');

var WriteFileTransform = require('../transforms/WriteFile');
var ZipTransform = require('../transforms/Zip');
var EntryProgressTransform = require('../transforms/EntryProgress');
var createWriteEntriesStream = require('./entries');

var tempFilename = require('../tempFilename');

var TMP_DIR = path.join(require('osenv').home(), '.tmp');

module.exports = function createWriteZipStream(dest, decompressors, options) {
  options = assign({ tempFilename: path.join(TMP_DIR, tempFilename('file.zip')) }, options);

  var transforms = decompressors.slice();
  transforms.push(new WriteFileTransform(options));
  transforms.push(new ZipTransform());
  !options.progress || transforms.push(new EntryProgressTransform(options));
  transforms.push(createWriteEntriesStream(dest, options));
  return pumpify(transforms);
};
