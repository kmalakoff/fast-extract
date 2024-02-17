const fs = require('fs');

module.exports = function writeTruncateFile(fullPath, callback) {
  fs.open(fullPath, 'w', (err, fd) => {
    if (err) return callback(err);
    fs.close(fd, callback);
  });
};
