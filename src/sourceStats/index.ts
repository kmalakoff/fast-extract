import getBasename from './basename.js';
import getSize from './size.js';

import type { SourceStats } from '../types.js';

export default function sourceStats(source, options, endpoint, callback) {
  if (typeof endpoint === 'function') {
    callback = endpoint;
    endpoint = null;
  }

  getSize(source, options, (err, size) => {
    if (err) return callback(err);
    const stats = {} as SourceStats;
    const basename = getBasename(source, options, endpoint);
    if (basename !== undefined) stats.basename = basename;
    if (size !== undefined) stats.size = size;
    callback(null, stats);
  });
}
