import path from 'path';

import statsBasename from '../../sourceStats/basename.ts';
import type { OptionsInternal, Pipeline } from '../../types.ts';
import DataProgressTransform from '../transforms/DataProgress.ts';
import PathToData from '../transforms/PathToData.ts';
import createWriteStream from '../write/file.ts';

export default function createFilePipeline(dest: string, streams: Pipeline, options: OptionsInternal): Pipeline {
  const isPath = typeof options.source === 'string';
  const basename = statsBasename(options.source, options);
  const fullPath = basename === undefined ? dest : path.join(dest, basename);

  streams = streams.slice();
  !isPath || streams.unshift(new PathToData());
  !options.progress || streams.push(DataProgressTransform({ basename: basename, fullPath: fullPath, ...options }));
  streams.push(createWriteStream(fullPath, options));
  return streams;
}
