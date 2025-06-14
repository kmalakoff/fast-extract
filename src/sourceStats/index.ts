import getBasename from './basename.js';
import getSize from './size.js';

import type { Options, Source, SourceStats } from '../types.js';

export type Callback = (error?: Error, stats?: SourceStats) => undefined;

export default function sourceStats(source: Source, options: Options, endpoint: string | Callback, callback?: Callback): undefined {
  if (typeof endpoint === 'function') {
    callback = endpoint as Callback;
    endpoint = null;
  }

  getSize(source, options, (err, size) => {
    if (err) return callback(err);
    const stats = {} as SourceStats;
    const basename = getBasename(source, options, endpoint as string);
    if (basename !== undefined) stats.basename = basename;
    if (size !== undefined) stats.size = size;
    callback(null, stats);
  });
}
