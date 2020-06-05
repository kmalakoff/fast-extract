var path = require('path');
var fs = require('fs');
var mkpath = require('mkpath');
var once = require('once');

var common = require('./common');

module.exports = function createFile(entry, stream, now, callback) {
  mkpath(path.dirname(entry.fullPath), function () {
    callback = once(callback);
    stream = stream.pipe(fs.createWriteStream(entry.fullPath));
    stream.on('error', callback);
    stream.on('close', function () {
      common(entry, now, callback);
    });
  });
};
