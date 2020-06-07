var inherits = require('inherits');
var path = require('path');
var fs = require('fs');
var mkpath = require('mkpath');
var pumpify = require('pumpify');
var eos = require('end-of-stream');

var BaseEntry = require('./Base');
var stripPath = require('../stripPath');
var waitForAccess = require('../waitForAccess');

function FileEntry(header, stream) {
  BaseEntry.call(this, header);
  this.stream = stream;
}

inherits(FileEntry, BaseEntry);

FileEntry.prototype.create = function create(dest, options, callback) {
  try {
    var self = this;
    this.fullPath = path.join(dest, stripPath(this.path, options));
    !options.progress || options.progress(this);
    mkpath(path.dirname(self.fullPath), function (err) {
      if (err && err.code !== 'EEXIST') return callback(err);

      var res = pumpify(self.stream, fs.createWriteStream(self.fullPath));
      eos(res, function (err) {
        if (err) return callback(err);

        // gunzip stream returns prematurely occassionally
        waitForAccess(self.fullPath, function () {
          self.setAttributes(self.fullPath, options, callback);
        });
      });
    });
  } catch (err) {
    return callback(err);
  }
};

module.exports = FileEntry;
