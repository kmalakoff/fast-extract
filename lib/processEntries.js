var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp-classic');
var once = require('once');
var Queue = require('queue-cb');
var throttle = require('lodash.throttle');

var drainStream = require('./drainStream');
var streamToBuffer = require('./streamToBuffer');

var LINK_CONCURRENCY = 10;

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
      if (strip > parts.length) callback(new Error('You cannot strip more levels than there are directories'));
      parts = parts.slice(strip);
      entry.path = parts.join(path.sep);
      entry.fullPath = path.join(dest, entry.path, entry.basename);
      !progress || progress(entry);

      if (entry.type === 'directory') {
        mkdirp(entry.fullPath, { mode: entry.mode }, function () {
          fs.utimes(entry.fullPath, now, entry.mtime, function (err) {
            err ? callback(err) : drainStream(stream, callback);
          });
        });
      } else if (entry.type === 'symlink' || entry.type === 'link') {
        if (typeof entry.linkname !== 'undefined') {
          links.push(entry);
          return drainStream(stream, callback);
        }
        streamToBuffer(stream, function (err, buffer) {
          if (err) return callback(err);
          entry.linkname = buffer.toString();
          links.push(entry);
          callback();
        });
      } else if (entry.type === 'file') {
        callback = once(callback);
        stream = stream.pipe(fs.createWriteStream(entry.fullPath, { mode: entry.mode }));
        stream.on('error', callback);
        stream.on('close', function () {
          fs.utimes(entry.fullPath, now, entry.mtime, callback);
        });
      } else callback();
    });
    extractInfo.onEntry.apply(null, args);
  });
  extract.on(extractInfo.close, function () {
    if (!links.length) return callback();
    var queue = new Queue(LINK_CONCURRENCY);
    for (var index = 0; index < links.length; index++) {
      var entry = links[index];
      var targetPath = path.join(dest, entry.path, entry.linkname);

      if (entry.type === 'entry') queue.defer(fs.link.bind(null, targetPath, entry.fullPath));
      else queue.defer(fs.symlink.bind(null, targetPath, entry.fullPath));
    }
    queue.await(callback);
  });
  extract.on('error', callback);
};
