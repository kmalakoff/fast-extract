import progressStream from 'progress-stream';
import type { Transform } from 'stream';
import statsSize from '../../sourceStats/size.ts';
import type { OptionsInternal, Progress, Source } from '../../types.ts';

export default function DataProgressTransform(options: OptionsInternal): Transform {
  const stats = { basename: options.basename };
  const progress = progressStream(
    {
      time: options.time,
    },
    (update) => {
      if (options.progress) options.progress({ ...update, ...stats, progress: 'write' } as Progress);
    }
  );

  statsSize(options.source as Source, options, (err, size) => {
    err || progress.setLength(size || 0);
  });
  return progress as unknown as Transform;
}
