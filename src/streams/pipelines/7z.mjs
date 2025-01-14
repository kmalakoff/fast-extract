import SevenZTransform from '../transforms/7z.mjs';
import EntryProgressTransform from '../transforms/EntryProgress.mjs';
import PathToData from '../transforms/PathToData.mjs';
import WriteFileTransform from '../transforms/WriteFile.mjs';
import createWriteEntriesStream from '../write/entries.mjs';

export default function create7zPipeline(_dest, _streams, _options) {
  throw new Error('7z not supported');
  // const isPath = typeof options.source === 'string';
  // streams = streams.slice();
  // if (isPath) {
  //   if (streams.length) {
  //     streams.unshift(new PathToData());
  //     streams.push(new WriteFileTransform(dest, options));
  //   }
  // } else {
  //   streams.push(new WriteFileTransform(dest, options));
  // }
  // streams.push(new SevenZTransform());
  // !options.progress || streams.push(new EntryProgressTransform(options));
  // streams.push(createWriteEntriesStream(dest, options));
  // return streams;
}
