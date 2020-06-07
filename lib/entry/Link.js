var inherits = require('inherits');
var path = require('path');
var fs = require('fs');
var compact = require('lodash.compact');
var mkpath = require('mkpath');
var Queue = require('queue-cb');

var BaseEntry = require('./Base');
var chmod = require('../fs/chmod');
var chown = require('../fs/chown');
var unlink = require('../fs/unlink');
var utimes = require('../fs/utimes');
var stripPath = require('../stripPath');

function LinkEntry(header) {
  BaseEntry.call(this, header);
  var parts = compact(this.path.split('/').slice(0, -1).concat(header.linkname.split('/')));
  this.targetPath = parts.join(path.sep);
}

inherits(LinkEntry, BaseEntry);

LinkEntry.prototype.create = function create(dest, options, callback) {
  try {
    var entry = this;
    entry.fullPath = path.join(dest, stripPath(entry.path, options));
    var targetFullPath = path.join(dest, stripPath(entry.targetPath, options));
    var link = fs[entry.type];

    var queue = new Queue(1);
    queue.defer(function (callback) {
      unlink(entry.fullPath, function (err) {
        err && err.code !== 'ENOENT' ? callback(err) : callback();
      });
    });
    queue.defer(function (callback) {
      mkpath(path.dirname(entry.fullPath), function (err) {
        err && err.code !== 'EEXIST' ? callback(err) : callback();
      });
    });
    queue.defer(link.bind(fs, targetFullPath, entry.fullPath));
    queue.defer(chmod.bind(null, entry, options));
    queue.defer(chown.bind(null, entry, options));
    queue.defer(utimes.bind(null, entry, options));
    queue.await(callback);
  } catch (err) {
    return callback(err);
  }
};

module.exports = LinkEntry;
