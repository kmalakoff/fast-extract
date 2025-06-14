import fs from 'fs';

export type Callback = (error?: Error) => undefined;

export default function writeTruncateFile(fullPath: string, callback: Callback): undefined {
  fs.open(fullPath, 'w', (err, fd) => {
    if (err) return callback(err);
    fs.close(fd, callback);
  });
}
