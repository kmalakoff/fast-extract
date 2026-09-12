var path = require('path');
var mkpath = require('mkpath');
var once = require('once');
var fsWriteStreamAtomic = require('fs-write-stream-atomic');

var common = require('./common');

module.exports = function createFile(entry, stream, now, callback) {
  mkpath(path.dirname(entry.fullPath), function () {
    callback = once(callback);
    stream = stream.pipe(fsWriteStreamAtomic(entry.fullPath));
    stream.on('error', callback);
    stream.on('close', function () {
      common(entry, now, callback);
    });
  });
};
