import fs from 'fs';
import Iterator, { type Entry } from 'fs-iterator';
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
      (entry: Entry): void => {
        spys(entry.stats as import('fs').Stats);
        if (onFile && (entry.stats as import('fs').Stats).isFile()) {
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
    return;
  }
  return new Promise((resolve, reject) => getStats(dir, (err, stats) => (err ? reject(err) : resolve(stats as Stats)), onFile));
}
