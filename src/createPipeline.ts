import zlib from 'zlib';
import bz2 from './compat/unbzip2-stream.ts';
import xz from './compat/xz-stream.ts';
import type { Pipeline } from './types.ts';

const TRANSORMS = {
  bz2: bz2,
  tgz: zlib.createUnzip.bind(zlib),
  gz: zlib.createUnzip.bind(zlib),
  xz: xz,
};

import create7ZPipeline from './streams/pipelines/7z.ts';
import createFilePipeline from './streams/pipelines/file.ts';
import createTarPipeline from './streams/pipelines/tar.ts';
import createZipPipeline from './streams/pipelines/zip.ts';

const WRITERS = {
  zip: createZipPipeline,
  tar: createTarPipeline,
  tgz: createTarPipeline,
  '7z': create7ZPipeline,
};

import extname from './extname.ts';
import statsBasename from './sourceStats/basename.ts';
import DestinationExists from './streams/transforms/DestinationExists.ts';
import DestinationRemove from './streams/transforms/DestinationRemove.ts';

import type { OptionsInternal } from './types.ts';

export default function createPipeline(dest: string, options: OptionsInternal): Pipeline {
  const type = options.type === undefined ? extname(statsBasename(options.source, options) || '') : options.type;

  const parts = type.split('.');
  const streams = [options.force ? new DestinationRemove(dest) : new DestinationExists(dest)];
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
