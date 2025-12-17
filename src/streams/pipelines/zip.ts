import type { OptionsInternal, Pipeline } from '../../types.ts';
import EntryProgressTransform from '../transforms/EntryProgress.ts';
import WriteFileTransform from '../transforms/WriteFile.ts';
import ZipTransform from '../transforms/Zip.ts';
import createWriteEntriesStream from '../write/entries.ts';

export default function createZipPipeline(dest: string, streams: Pipeline, options: OptionsInternal): Pipeline {
  streams = streams.slice();
  // ZipIterator requires a file path, so write stream data to temp file first
  streams.push(new WriteFileTransform(dest, options));
  streams.push(new ZipTransform());
  !options.progress || streams.push(new EntryProgressTransform(options));
  streams.push(createWriteEntriesStream(dest, options));
  return streams;
}
