import type { Options, Source, SourceStats } from '../types.ts';
import getBasename from './basename.ts';
import getSize from './size.ts';

export type Callback = (error?: Error, stats?: SourceStats) => void;

export default function sourceStats(source: Source, options: Options, endpoint: string | Callback, callback?: Callback): void {
  const cb: Callback = typeof endpoint === 'function' ? endpoint : (callback as Callback);
  const ep: string | undefined = typeof endpoint === 'function' ? undefined : endpoint;

  getSize(source, options, (err, size) => {
    if (err) return cb(err);
    const stats = {} as SourceStats;
    const basename = getBasename(source, options, ep);
    if (basename !== undefined) stats.basename = basename;
    if (size !== undefined) stats.size = size;
    cb(undefined, stats);
  });
}
