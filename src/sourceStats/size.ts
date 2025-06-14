import fs from 'fs';

import type { Options, Source } from '../types.js';

export type Callback = (error?: Error, size?: number) => undefined;

export default function getSize(source: Source, options: Options, callback: Callback): undefined {
  // options
  if (options.size !== undefined) return callback(null, options.size);

  // path
  if (typeof source === 'string') {
    fs.stat(source, (err, stats) => {
      err ? callback(err) : callback(null, stats.size);
    });
    return;
  }
  // stream
  if (source) {
    if (source.headers && source.headers['content-length']) return callback(null, +source.headers['content-length']);
    if (source.size) return callback(null, source.size);
  }
  callback();
}
