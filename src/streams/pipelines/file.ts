import path from 'path';

import statsBasename from '../../sourceStats/basename.js';
import DataProgressTransform from '../transforms/DataProgress.js';
import PathToData from '../transforms/PathToData.js';
import createWriteStream from '../write/file.js';

export default function createFilePipeline(dest, streams, options) {
  const isPath = typeof options.source === 'string';
  const basename = statsBasename(options.source, options);
  const fullPath = basename === undefined ? dest : path.join(dest, basename);

  streams = streams.slice();
  !isPath || streams.unshift(new PathToData());
  !options.progress || streams.push(DataProgressTransform({ basename: basename, fullPath: fullPath, ...options }));
  streams.push(createWriteStream(fullPath, options));
  return streams;
}
