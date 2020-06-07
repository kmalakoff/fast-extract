var inherits = require('inherits');
var path = require('path');
var mkpath = require('mkpath');
var Queue = require('queue-cb');

var BaseEntry = require('./Base');
var chmod = require('../fs/chmod');
var chown = require('../fs/chown');
var utimes = require('../fs/utimes');
var stripPath = require('../stripPath');

function DirectoryEntry(header) {
  BaseEntry.call(this, header);
}

inherits(DirectoryEntry, BaseEntry);

DirectoryEntry.prototype.create = function create(dest, options, callback) {
  try {
    var entry = this;
    entry.fullPath = path.join(dest, stripPath(entry.path, options));
    !options.progress || options.progress(entry);

    var queue = new Queue(1);
    queue.defer(function (callback) {
      mkpath(entry.fullPath, function (err) {
        err && err.code !== 'EEXIST' ? callback(err) : callback();
      });
    });
    queue.defer(chmod.bind(null, entry));
    queue.defer(chown.bind(null, entry));
    queue.defer(utimes.bind(null, entry, options.now));
    queue.await(callback);
  } catch (err) {
    return callback(err);
  }
};

module.exports = DirectoryEntry;
