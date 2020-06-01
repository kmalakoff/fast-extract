var path = require('path');
var fs = require('graceful-fs');
var mkpath = require('mkpath');
var once = require('once');
var assign = require('object-assign');
var fsWriteStreamAtomic = require('fs-write-stream-atomic');

module.exports = function createFile(entry, stream, options, callback) {
  mkpath(path.dirname(entry.fullPath), function () {
    callback = once(callback);
    var writeStreamOptions = options.writeStreamOptions ? assign({ mode: entry.mode }, options.writeStreamOptions || {}) : { mode: entry.mode };
    stream = stream.pipe(fsWriteStreamAtomic(entry.fullPath, writeStreamOptions));
    stream.on('error', callback);
    stream.on('close', function () {
      fs.utimes(entry.fullPath, options.now, entry.mtime, callback);
    });
  });
};
