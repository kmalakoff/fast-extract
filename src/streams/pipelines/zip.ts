import type { OptionsInternal, Pipeline } from '../../types.ts';
import EntryProgressTransform from '../transforms/EntryProgress.ts';
import ZipTransform from '../transforms/Zip.ts';
import createWriteEntriesStream from '../write/entries.ts';

export default function createZipPipeline(dest: string, streams: Pipeline, options: OptionsInternal): Pipeline {
  streams = streams.slice();
  streams.push(new ZipTransform());
  !options.progress || streams.push(new EntryProgressTransform(options));
  streams.push(createWriteEntriesStream(dest, options));
  return streams;
}
