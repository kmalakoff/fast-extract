// import SevenZTransform from '../transforms/7z.ts';
// import EntryProgressTransform from '../transforms/EntryProgress.ts';
// import PathToData from '../transforms/PathToData.ts';
// import WriteFileTransform from '../transforms/WriteFile.ts';
// import createWriteEntriesStream from '../write/entries.ts';

import type { OptionsInternal, Pipeline } from '../../types.ts';

export default function create7zPipeline(_dest: string, _streams: Pipeline, _options: OptionsInternal): Pipeline {
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
