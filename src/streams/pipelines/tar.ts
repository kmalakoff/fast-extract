import type { OptionsInternal, Pipeline } from '../../types.ts';
import EntryProgressTransform from '../transforms/EntryProgress.ts';
import PathToData from '../transforms/PathToData.ts';
import TarTransform from '../transforms/Tar.ts';
import createWriteEntriesStream from '../write/entries.ts';

export default function createTarPipeline(dest: string, streams: Pipeline, options: OptionsInternal): Pipeline {
  const isPath = typeof options.source === 'string';
  streams = streams.slice();
  !isPath || streams.unshift(new PathToData());
  streams.push(new TarTransform());
  !options.progress || streams.push(new EntryProgressTransform(options));
  streams.push(createWriteEntriesStream(dest, options));
  return streams;
}
