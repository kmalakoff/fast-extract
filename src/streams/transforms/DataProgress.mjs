import progressStream from 'progress-stream';
import statsSize from '../../sourceStats/size';

export default function DataProgressTransform(options) {
  const stats = { basename: options.basename };
  const progress = progressStream(
    {
      time: options.time,
    },
    (update) => {
      options.progress(Object.assign({ progress: 'write' }, update, stats));
    }
  );

  statsSize(options.source, options, (err, size) => {
    err || progress.setLength(size || 0);
  });
  return progress;
}
