const bz2 = require('unbzip2-stream');
const zlib = require('zlib');

// lzma-native module compatiblity starts at Node 6
const major = +process.versions.node.split('.')[0];
const lzmaNative = major >= 10 ? require('./optionalRequire.cjs')('lzma-native') : null;

const TRANSORMS = {
  bz2: bz2,
  tgz: zlib.createUnzip.bind(zlib),
  gz: zlib.createUnzip.bind(zlib),
  xz: lzmaNative ? lzmaNative.createDecompressor.bind(lzmaNative) : undefined,
};

const createFilePipeline = require('./streams/pipelines/file.cjs');
const createTarPipeline = require('./streams/pipelines/tar.cjs');
const createZipPipeline = require('./streams/pipelines/zip.cjs');

const WRITERS = {
  zip: createZipPipeline,
  tar: createTarPipeline,
  tgz: createTarPipeline,
};

const DestinationNotExists = require('./streams/transforms/DestinationNotExists.cjs');
const DestinationRemove = require('./streams/transforms/DestinationRemove.cjs');

const extname = require('./extname.cjs');
const statsBasename = require('./sourceStats/basename');

module.exports = function createPipeline(dest, options) {
  const type = options.type === undefined ? extname(statsBasename(options.source, options) || '') : options.type;

  const parts = type.split('.');
  const streams = [options.force ? new DestinationRemove(dest) : new DestinationNotExists(dest)];
  for (let index = parts.length - 1; index >= 0; index--) {
    // append transform
    const transform = TRANSORMS[parts[index]];
    if (transform) streams.push(transform());

    // finish with a write stream
    const writer = WRITERS[parts[index]];
    if (writer) return writer(dest, streams, options);
  }

  // default is to write the result to a file
  return createFilePipeline(dest, streams, options);
};
