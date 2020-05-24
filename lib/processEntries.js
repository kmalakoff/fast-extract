var path = require('path');
var fs = require('graceful-fs');
var mkpath = require('mkpath');
var once = require('once');
var onceNextTick = require('call-once-next-tick');
var Queue = require('queue-cb');
var throttle = require('lodash.throttle');
var fsWriteStreamAtomic = require('fs-write-stream-atomic');

var drainStream = require('./drainStream');
var streamToBuffer = require('./streamToBuffer');

function createDirectory(entry, stream, now, callback) {
  mkpath(entry.fullPath, function () {
    fs.chmod(entry.fullPath, entry.mode, function (err) {
      if (err) return callback(err);

      fs.utimes(entry.fullPath, now, entry.mtime, function (err) {
        err ? callback(err) : drainStream(stream, callback);
      });
    });
  });
}

function createFile(entry, stream, now, callback) {
  mkpath(path.dirname(entry.fullPath), function () {
    callback = once(callback);
    stream = stream.pipe(fsWriteStreamAtomic(entry.fullPath, { mode: entry.mode }));
    stream.on('error', callback);
    stream.on('close', function () {
      fs.utimes(entry.fullPath, now, entry.mtime, callback);
    });
  });
}

function prepareLink(entry, stream, now, callback) {
  entry.now = now;
  if (typeof entry.linkname !== 'undefined') return drainStream(stream, callback);
  streamToBuffer(stream, function (err, buffer) {
    if (err) return callback(err);
    entry.linkname = buffer.toString();
    callback();
  });
}

function createLink(entry, dest, callback) {
  callback = onceNextTick(callback); // unwind stack
  fs.unlink(entry.fullPath, function () {
    var targetPath = path.join(dest, entry.path, entry.linkname);
    mkpath(path.dirname(targetPath), function () {
      var link = entry.type === 'symlink' ? fs.symlink : fs.link;
      link(targetPath, entry.fullPath, callback);
    });
  });
}

module.exports = function processEntries(extractInfo, dest, options, callback) {
  var now = new Date();
  var links = [];
  var extract = extractInfo.extract;
  var strip = options.strip || 0;

  var progress = null;
  if (options.progress) {
    progress = function (entry) {
      entry.progress = 'extract';
      options.progress(entry);
    };
    if (options.time) progress = throttle(progress, options.time);
  }

  extract.on('entry', function () {
    var args = Array.prototype.slice.call(arguments, 0);
    args.push(function (entry, stream, callback) {
      var parts = entry.path.split(path.sep);
      if (parts.length < strip) return callback(new Error('You cannot strip more levels than there are directories'));
      parts = parts.slice(strip);
      entry.path = parts.join(path.sep);
      entry.fullPath = path.join(dest, entry.path, entry.basename);
      !progress || progress(entry);

      if (entry.type === 'directory') createDirectory(entry, stream, now, callback);
      else if (entry.type === 'symlink' || entry.type === 'link')
        prepareLink(entry, stream, now, function (err) {
          if (err) return callback(err);
          links.push(entry);
          callback();
        });
      else if (entry.type === 'file') createFile(entry, stream, now, callback);
      else callback();
    });
    extractInfo.onEntry.apply(null, args);
  });

  extract.on(extractInfo.close, function () {
    if (!links.length) return callback();
    var queue = new Queue();
    for (var index = 0; index < links.length; index++) {
      queue.defer(createLink.bind(null, links[index], dest));
    }
    queue.await(callback);
  });
  extract.on('error', callback);
};
