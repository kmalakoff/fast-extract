var path = require('path');
var assign = require('object-assign');
var pumpify = require('pumpify');

var createWriteFileStream = require('./lib/file');
var DataProgressTransform = require('../transforms/DataProgress');

module.exports = function createWriteFileStreamPipeline(dest, decompressors, options) {
  var basename = options.basename || options.filename;
  var fullPath = basename === undefined ? dest : path.join(dest, basename);

  var transforms = decompressors.slice();
  !options.progress || transforms.push(new DataProgressTransform(assign({ basename: basename, fullPath: fullPath }, options)));
  transforms.push(createWriteFileStream(fullPath));
  return transforms.length === 1 ? transforms[0] : pumpify(transforms);
};
