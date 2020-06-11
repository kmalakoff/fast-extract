var EntryProgressTransform = require('../transforms/EntryProgress');
var TarTransform = require('../transforms/Tar');
var PathToData = require('../transforms/PathToData');
var createWriteEntriesStream = require('../write/entries');

module.exports = function createTarPipeline(dest, streams, options) {
  var isPath = typeof options.source === 'string';
  streams = streams.slice();
  !isPath || streams.unshift(new PathToData());
  streams.push(new TarTransform());
  !options.progress || streams.push(new EntryProgressTransform(options));
  streams.push(createWriteEntriesStream(dest, options));
  return streams;
};
