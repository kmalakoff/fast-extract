import type { OptionsInternal, Pipeline } from '../../types.ts';
import SevenZTransform from '../transforms/7z.ts';
import EntryProgressTransform from '../transforms/EntryProgress.ts';
import createWriteEntriesStream from '../write/entries.ts';

export default function create7zPipeline(dest: string, streams: Pipeline, options: OptionsInternal): Pipeline {
  streams = streams.slice();
  streams.push(new SevenZTransform());
  !options.progress || streams.push(new EntryProgressTransform(options));
  streams.push(createWriteEntriesStream(dest, options));
  return streams;
}
