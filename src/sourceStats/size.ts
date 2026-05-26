import fs from 'fs';

import type { Options, Source } from '../types.ts';

export type Callback = (error?: Error | null, size?: number) => void;

export default function getSize(source: Source, options: Options, callback: Callback): void {
  // options
  if (options.size !== undefined) return callback(undefined, options.size);

  // path
  if (typeof source === 'string') {
    fs.stat(source, (err, stats) => {
      err ? callback(err) : callback(undefined, stats.size);
    });
    return;
  }
  // stream
  if (source) {
    if (source.headers && source.headers['content-length']) return callback(undefined, +source.headers['content-length']);
    if (source.size) return callback(undefined, source.size);
  }
  callback();
}
