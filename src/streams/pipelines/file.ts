import path from 'path';

import statsBasename from '../../sourceStats/basename.ts';
import type { OptionsInternal, Pipeline } from '../../types.ts';
import DataProgressTransform from '../transforms/DataProgress.ts';
import createWriteStream from '../write/file.ts';

export default function createFilePipeline(dest: string, streams: Pipeline, options: OptionsInternal): Pipeline {
  const basename = statsBasename(options.source, options);
  const fullPath = basename === undefined ? dest : path.join(dest, basename);

  streams = streams.slice();
  !options.progress || streams.push(DataProgressTransform({ basename: basename, fullPath: fullPath, ...options }));
  streams.push(createWriteStream(fullPath, options));
  return streams;
}
