import fs from 'graceful-fs';

export type Callback = (error?: Error | null) => void;

export default function writeTruncateFile(fullPath: string, callback: Callback): void {
  fs.open(fullPath, 'w', (err, fd) => {
    if (err) return callback(err);
    fs.close(fd, (closeErr) => callback(closeErr));
  });
}
