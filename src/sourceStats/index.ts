import type { Options, Source, SourceStats } from '../types.ts';
import getBasename from './basename.ts';
import getSize from './size.ts';

export type Callback = (error?: Error, stats?: SourceStats) => void;

export default function sourceStats(source: Source, options: Options, endpoint: string | Callback, callback?: Callback): void {
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
