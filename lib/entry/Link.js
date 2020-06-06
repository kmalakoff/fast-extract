var inherits = require('inherits');
var path = require('path');
var fs = require('fs');
var mkpath = require('mkpath');

var BaseEntry = require('./Base');
var stripPath = require('../stripPath');

function LinkEntry(header) {
  BaseEntry.call(this, header);
  var parts = this.path.split('/').slice(0, -1);
  parts = parts.concat(header.linkname.split('/'));
  this.targetPath = parts.join(path.sep);
}

inherits(LinkEntry, BaseEntry);

LinkEntry.prototype.create = function create(dest, options, callback) {
  try {
    var self = this;
    var fullPath = path.join(dest, stripPath(this.path, options));
    var targetPath = path.join(dest, stripPath(this.targetPath, options));

    fs.unlink(fullPath, function (err) {
      if (err && err.code !== 'ENOENT') return callback(err);

      mkpath(path.dirname(fullPath), function (err) {
        if (err && err.code !== 'EEXIST') return callback(err);

        fs[self.type](targetPath, fullPath, function (err) {
          err ? callback(err) : self.setAttributes(fullPath, options, callback);
        });
      });
    });
  } catch (err) {
    return callback(err);
  }
};

module.exports = LinkEntry;
