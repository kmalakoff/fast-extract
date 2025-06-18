import type { OptionsInternal, Pipeline } from '../../types.js';
import EntryProgressTransform from '../transforms/EntryProgress.js';
import PathToData from '../transforms/PathToData.js';
import TarTransform from '../transforms/Tar.js';
import createWriteEntriesStream from '../write/entries.js';

export default function createTarPipeline(dest: string, streams: Pipeline, options: OptionsInternal): Pipeline {
  const isPath = typeof options.source === 'string';
  streams = streams.slice();
  !isPath || streams.unshift(new PathToData());
  streams.push(new TarTransform());
  !options.progress || streams.push(new EntryProgressTransform(options));
  streams.push(createWriteEntriesStream(dest, options));
  return streams;
}
