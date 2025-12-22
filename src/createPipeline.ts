import SevenZipIterator from '7z-iterator';
import type { Transform } from 'stream';
import TarIterator from 'tar-iterator';
import unbzip2Stream from 'unbzip2-stream';
import { createXZDecoder } from 'xz-compat';
import ZipIterator from 'zip-iterator';
import zlib from 'zlib';

import extname from './extname.ts';
import statsBasename from './sourceStats/basename.ts';
import createFilePipeline from './streams/pipelines/file.ts';
import DestinationExists from './streams/transforms/DestinationExists.ts';
import DestinationRemove from './streams/transforms/DestinationRemove.ts';
import EntryProgressTransform from './streams/transforms/EntryProgress.ts';
import createIteratorTransform from './streams/transforms/IteratorTransform.ts';
import createWriteEntriesStream from './streams/write/entries.ts';

import type { OptionsInternal, Pipeline } from './types.ts';

const TRANSFORMS = {
  bz2: unbzip2Stream,
  tgz: zlib.createUnzip.bind(zlib),
  gz: zlib.createUnzip.bind(zlib),
  xz: createXZDecoder,
};

// Create transform classes for each iterator type
const ZipTransform = createIteratorTransform(ZipIterator);
const TarTransform = createIteratorTransform(TarIterator);
const SevenZTransform = createIteratorTransform(SevenZipIterator);

function createArchivePipeline(dest: string, streams: Pipeline, options: OptionsInternal, TransformClass: new () => Transform): Pipeline {
  streams = streams.slice();
  streams.push(new TransformClass());
  if (options.progress) streams.push(new EntryProgressTransform(options));
  streams.push(createWriteEntriesStream(dest, options));
  return streams;
}

const WRITERS = {
  zip: (dest: string, streams: Pipeline, options: OptionsInternal) => createArchivePipeline(dest, streams, options, ZipTransform),
  tar: (dest: string, streams: Pipeline, options: OptionsInternal) => createArchivePipeline(dest, streams, options, TarTransform),
  tgz: (dest: string, streams: Pipeline, options: OptionsInternal) => createArchivePipeline(dest, streams, options, TarTransform),
  '7z': (dest: string, streams: Pipeline, options: OptionsInternal) => createArchivePipeline(dest, streams, options, SevenZTransform),
};

export default function createPipeline(dest: string, options: OptionsInternal): Pipeline {
  const type = options.type === undefined ? extname(statsBasename(options.source, options) || '') : options.type;

  const parts = type.split('.');
  const streams = [options.force ? new DestinationRemove(dest) : new DestinationExists(dest)];
  for (let index = parts.length - 1; index >= 0; index--) {
    // append transform
    const transform = TRANSFORMS[parts[index]];
    if (transform) streams.push(transform());

    // finish with a write stream
    const writer = WRITERS[parts[index]];
    if (writer) return writer(dest, streams, options);
  }

  // default is to write the result to a file
  return createFilePipeline(dest, streams, options);
}
