import fs from 'fs';
import Iterator from 'fs-iterator';
import statsSpys from 'fs-stats-spys';

export interface Stats {
  dirs: number;
  files: number;
  links: number;
}

export type FileCallback = (fullPath: string, content: Buffer) => void;

export default function getStats(dir: string, callback?: (err: Error | null, stats?: Stats) => void, onFile?: FileCallback): void | Promise<Stats> {
  if (typeof callback === 'function') {
    const spys = statsSpys();
    new Iterator(dir, { lstat: true }).forEach(
      (entry): void => {
        spys(entry.stats);
        if (onFile && entry.stats.isFile()) {
          onFile(entry.fullPath, fs.readFileSync(entry.fullPath));
        }
      },
      (err): void => {
        if (err) return callback(err);
        callback(null, {
          dirs: spys.dir.callCount,
          files: spys.file.callCount,
          links: spys.link.callCount,
        });
      }
    );
  } else {
    return new Promise((resolve, reject) => {
      getStats(
        dir,
        (err, stats) => {
          if (err) reject(err);
          else resolve(stats as Stats);
        },
        onFile
      );
    });
  }
}
