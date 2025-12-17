import type { OptionsInternal, Pipeline } from '../../types.ts';
import SevenZTransform from '../transforms/7z.ts';
import EntryProgressTransform from '../transforms/EntryProgress.ts';
import WriteFileTransform from '../transforms/WriteFile.ts';
import createWriteEntriesStream from '../write/entries.ts';

export default function create7zPipeline(dest: string, streams: Pipeline, options: OptionsInternal): Pipeline {
  streams = streams.slice();
  // 7z-iterator requires a file path, so write stream data to temp file first
  streams.push(new WriteFileTransform(dest, options));
  streams.push(new SevenZTransform());
  !options.progress || streams.push(new EntryProgressTransform(options));
  streams.push(createWriteEntriesStream(dest, options));
  return streams;
}
