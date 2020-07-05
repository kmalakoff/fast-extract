var bz2 = require('unbzip2-stream');
var zlib = require('zlib');

// lzma-native module compatiblity starts at Node 6
var major = +process.versions.node.split('.')[0];
var lzmaNative = major >= 6 ? require('./optionalRequire')('lzma-native') : null;

var TRANSORMS = {
  bz2: bz2,
  tgz: zlib.createUnzip.bind(zlib),
  gz: zlib.createUnzip.bind(zlib),
  xz: lzmaNative ? lzmaNative.createDecompressor.bind(lzmaNative) : undefined,
};

var createFilePipeline = require('./streams/pipelines/file');
var createTarPipeline = require('./streams/pipelines/tar');
var createZipPipeline = require('./streams/pipelines/zip');

var WRITERS = {
  zip: createZipPipeline,
  tar: createTarPipeline,
  tgz: createTarPipeline,
};

var DestinationNotExists = require('./streams/transforms/DestinationNotExists');
var DestinationRemove = require('./streams/transforms/DestinationRemove');

var extname = require('./extname');
var statsBasename = require('./sourceStats/basename');

module.exports = function createPipeline(dest, options) {
  var type = options.type === undefined ? extname(statsBasename(options.source, options) || '') : options.type;

  var parts = type.split('.');
  var streams = [options.force ? new DestinationRemove(dest) : new DestinationNotExists(dest)];
  for (var index = parts.length - 1; index >= 0; index--) {
    // append transform
    var transform = TRANSORMS[parts[index]];
    if (transform) streams.push(transform());

    // finish with a write stream
    var writer = WRITERS[parts[index]];
    if (writer) return writer(dest, streams, options);
  }

  // default is to write the result to a file
  return createFilePipeline(dest, streams, options);
};
