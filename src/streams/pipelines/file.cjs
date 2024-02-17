const path = require('path');

const createWriteStream = require('../write/file.cjs');
const DataProgressTransform = require('../transforms/DataProgress.cjs');
const PathToData = require('../transforms/PathToData.cjs');
const statsBasename = require('../../sourceStats/basename');

module.exports = function createFilePipeline(dest, streams, options) {
  const isPath = typeof options.source === 'string';
  const basename = statsBasename(options.source, options);
  const fullPath = basename === undefined ? dest : path.join(dest, basename);

  streams = streams.slice();
  !isPath || streams.unshift(new PathToData());
  !options.progress || streams.push(new DataProgressTransform(Object.assign({ basename: basename, fullPath: fullPath }, options)));
  streams.push(createWriteStream(fullPath, options));
  return streams;
};
