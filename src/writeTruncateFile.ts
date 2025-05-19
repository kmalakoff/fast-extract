import fs from 'fs';

export default function writeTruncateFile(fullPath, callback) {
  fs.open(fullPath, 'w', (err, fd) => {
    if (err) return callback(err);
    fs.close(fd, callback);
  });
}
