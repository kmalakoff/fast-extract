var path = require('path');
var assign = require('object-assign');

var createWriteStream = require('../writeStreams/file');
var DataProgressTransform = require('../transforms/DataProgress');
var pipeline = require('../pipeline');

module.exports = function createFilePipeline(dest, decompressors, options) {
  var basename = options.basename || options.filename;
  var fullPath = basename === undefined ? dest : path.join(dest, basename);

  var transforms = decompressors.slice();
  !options.progress || transforms.push(new DataProgressTransform(assign({ basename: basename, fullPath: fullPath }, options)));
  transforms.push(createWriteStream(fullPath));
  return pipeline(transforms);
};
