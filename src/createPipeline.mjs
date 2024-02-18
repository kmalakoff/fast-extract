import zlib from 'zlib';
import bz2 from 'unbzip2-stream';
import optionalRequire  from './optionalRequire.cjs';

// lzma-native module compatiblity starts at Node 6
const major = +process.versions.node.split('.')[0];
const lzmaNative = major >= 10 ? optionalRequire('lzma-native') : null;

const TRANSORMS = {
  bz2: bz2,
  tgz: zlib.createUnzip.bind(zlib),
  gz: zlib.createUnzip.bind(zlib),
  xz: lzmaNative && lzmaNative.createDecompressor ? lzmaNative.createDecompressor.bind(lzmaNative) : undefined,
};

import createFilePipeline from './streams/pipelines/file.mjs';
import createTarPipeline from './streams/pipelines/tar.mjs';
import createZipPipeline from './streams/pipelines/zip.mjs';

const WRITERS = {
  zip: createZipPipeline,
  tar: createTarPipeline,
  tgz: createTarPipeline,
};

import DestinationNotExists from './streams/transforms/DestinationNotExists.mjs';
import DestinationRemove from './streams/transforms/DestinationRemove.mjs';

import extname from './extname.mjs';
import statsBasename from './sourceStats/basename';

export default function createPipeline(dest, options) {
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
}
