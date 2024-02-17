const EntryProgressTransform = require('../transforms/EntryProgress.cjs');
const PathToData = require('../transforms/PathToData.cjs');
const WriteFileTransform = require('../transforms/WriteFile.cjs');
const ZipTransform = require('../transforms/Zip.cjs');
const createWriteEntriesStream = require('../write/entries.cjs');

module.exports = function createZipPipeline(dest, streams, options) {
  const isPath = typeof options.source === 'string';
  streams = streams.slice();
  if (isPath) {
    if (streams.length) {
      streams.unshift(new PathToData());
      streams.push(new WriteFileTransform(dest, options));
    }
  } else {
    streams.push(new WriteFileTransform(dest, options));
  }
  streams.push(new ZipTransform());
  !options.progress || streams.push(new EntryProgressTransform(options));
  streams.push(createWriteEntriesStream(dest, options));
  return streams;
};
