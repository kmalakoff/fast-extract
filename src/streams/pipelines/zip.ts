import type { OptionsInternal, Pipeline } from '../../types.ts';
import EntryProgressTransform from '../transforms/EntryProgress.ts';
import PathToData from '../transforms/PathToData.ts';
import WriteFileTransform from '../transforms/WriteFile.ts';
import ZipTransform from '../transforms/Zip.ts';
import createWriteEntriesStream from '../write/entries.ts';

export default function createZipPipeline(dest: string, streams: Pipeline, options: OptionsInternal): Pipeline {
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
}
