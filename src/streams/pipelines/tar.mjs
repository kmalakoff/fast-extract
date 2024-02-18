import EntryProgressTransform from '../transforms/EntryProgress.mjs';
import PathToData from '../transforms/PathToData.mjs';
import TarTransform from '../transforms/Tar.mjs';
import createWriteEntriesStream from '../write/entries.mjs';

export default function createTarPipeline(dest, streams, options) {
  const isPath = typeof options.source === 'string';
  streams = streams.slice();
  !isPath || streams.unshift(new PathToData());
  streams.push(new TarTransform());
  !options.progress || streams.push(new EntryProgressTransform(options));
  streams.push(createWriteEntriesStream(dest, options));
  return streams;
}
