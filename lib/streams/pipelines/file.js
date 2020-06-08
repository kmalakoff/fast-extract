var path = require('path');
var assign = require('object-assign');

var createWriteStream = require('../write/file');
var DataProgressTransform = require('../transforms/DataProgress');
var PathToData = require('../transforms/PathToData');

module.exports = function createFilePipeline(dest, streams, options) {
  var basename = options.basename || options.filename;
  var fullPath = basename === undefined ? dest : path.join(dest, basename);

  streams = streams.slice();
  !options.path || streams.unshift(new PathToData());
  !options.progress || streams.push(new DataProgressTransform(assign({ basename: basename, fullPath: fullPath }, options)));
  streams.push(createWriteStream(fullPath));
  return streams;
};
