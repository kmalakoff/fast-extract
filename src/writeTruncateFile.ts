import fs from 'fs';

export type Callback = (error?: Error) => void;

export default function writeTruncateFile(fullPath: string, callback: Callback): void {
  fs.open(fullPath, 'w', (err, fd) => {
    if (err) return callback(err);
    fs.close(fd, callback);
  });
}
