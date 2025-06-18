import progressStream from 'progress-stream';
import type { Transform } from 'stream';
import statsSize from '../../sourceStats/size.js';
import type { OptionsInternal, Progress } from '../../types.js';

export default function DataProgressTransform(options?: OptionsInternal): Transform {
  const stats = options ? { basename: options.basename } : {};
  const progress = progressStream(
    {
      time: options.time,
    },
    (update: Progress) => {
      options.progress({ progress: 'write', ...update, ...stats });
    }
  );

  statsSize(options.source, options, (err, size) => {
    err || progress.setLength(size || 0);
  });
  return progress;
}
