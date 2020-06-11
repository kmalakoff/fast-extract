var path = require('path');
var assign = require('object-assign');

var createWriteStream = require('../write/file');
var DataProgressTransform = require('../transforms/DataProgress');
var PathToData = require('../transforms/PathToData');
var statsBasename = require('../../sourceStats/basename');

module.exports = function createFilePipeline(dest, streams, options) {
  var isPath = typeof options.source === 'string';
  var basename = statsBasename(options.source, options);
  var fullPath = basename === undefined ? dest : path.join(dest, basename);

  streams = streams.slice();
  !isPath || streams.unshift(new PathToData());
  !options.progress || streams.push(new DataProgressTransform(assign({ basename: basename, fullPath: fullPath }, options)));
  streams.push(createWriteStream(fullPath, options));
  return streams;
};
