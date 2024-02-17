const EntryProgressTransform = require('../transforms/EntryProgress.cjs');
const TarTransform = require('../transforms/Tar.cjs');
const PathToData = require('../transforms/PathToData.cjs');
const createWriteEntriesStream = require('../write/entries.cjs');

module.exports = function createTarPipeline(dest, streams, options) {
  const isPath = typeof options.source === 'string';
  streams = streams.slice();
  !isPath || streams.unshift(new PathToData());
  streams.push(new TarTransform());
  !options.progress || streams.push(new EntryProgressTransform(options));
  streams.push(createWriteEntriesStream(dest, options));
  return streams;
};
