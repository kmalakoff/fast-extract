var path = require('path');
var fs = require('fs');
var mkpath = require('mkpath');

var common = require('./common');

module.exports = function createLink(entry, now, callback) {
  fs.unlink(entry.fullPath, function () {
    mkpath(path.dirname(entry.targetPath), function () {
      fs[entry.type](entry.targetPath, entry.fullPath, function (err) {
        err ? callback(err) : common(entry, now, callback);
      });
    });
  });
};
