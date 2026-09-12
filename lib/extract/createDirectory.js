var mkpath = require('mkpath');

var common = require('./common');

module.exports = function createDirectory(entry, now, callback) {
  mkpath(entry.fullPath, function () {
    common(entry, now, callback);
  });
};
