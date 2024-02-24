import path from 'path';

import statsBasename from '../../sourceStats/basename.mjs';
import DataProgressTransform from '../transforms/DataProgress.mjs';
import PathToData from '../transforms/PathToData.mjs';
import createWriteStream from '../write/file.mjs';

export default function createFilePipeline(dest, streams, options) {
  const isPath = typeof options.source === 'string';
  const basename = statsBasename(options.source, options);
  const fullPath = basename === undefined ? dest : path.join(dest, basename);

  streams = streams.slice();
  !isPath || streams.unshift(new PathToData());
  !options.progress || streams.push(new DataProgressTransform(Object.assign({ basename: basename, fullPath: fullPath }, options)));
  streams.push(createWriteStream(fullPath, options));
  return streams;
}
