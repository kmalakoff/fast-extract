var access = require('fs-access-compat');

function waitForAccess(fullPath, callback) {
  access(fullPath, function (err) {
    if (err) return waitForAccess(fullPath, callback);
    callback();
  });
}

module.exports = waitForAccess;
