var inherits = require('inherits');
var path = require('path');
var fs = require('fs');
var mkpath = require('mkpath');
var pumpify = require('pumpify');
var eos = require('end-of-stream');
var Queue = require('queue-cb');

var BaseEntry = require('./Base');
var chmod = require('../fs/chmod');
var chown = require('../fs/chown');
var utimes = require('../fs/utimes');
var stripPath = require('../stripPath');
var waitForAccess = require('../waitForAccess');

function FileEntry(header, stream) {
  BaseEntry.call(this, header);
  this.stream = stream;
}

inherits(FileEntry, BaseEntry);

FileEntry.prototype.create = function create(dest, options, callback) {
  try {
    var entry = this;
    entry.fullPath = path.join(dest, stripPath(entry.path, options));
    !options.progress || options.progress(entry);

    var queue = new Queue(1);
    queue.defer(function (callback) {
      mkpath(path.dirname(entry.fullPath), function (err) {
        err && err.code !== 'EEXIST' ? callback(err) : callback();
      });
    });
    queue.defer(function (callback) {
      var res = pumpify(entry.stream, fs.createWriteStream(entry.fullPath));
      eos(res, function (err) {
        err ? callback(err) : waitForAccess(entry.fullPath, callback); // gunzip stream returns prematurely occassionally
      });
    });
    queue.defer(chmod.bind(null, entry, options));
    queue.defer(chown.bind(null, entry, options));
    queue.defer(utimes.bind(null, entry, options));
    queue.await(callback);
  } catch (err) {
    return callback(err);
  }
};

module.exports = FileEntry;
