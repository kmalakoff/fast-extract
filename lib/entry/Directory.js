var inherits = require('inherits');
var path = require('path');
var mkpath = require('mkpath');

var BaseEntry = require('./Base');
var stripPath = require('../stripPath');

function DirectoryEntry(header) {
  BaseEntry.call(this, header);
}

inherits(DirectoryEntry, BaseEntry);

DirectoryEntry.prototype.create = function create(dest, options, callback) {
  try {
    var self = this;
    var fullPath = path.join(dest, stripPath(this.path, options));
    mkpath(fullPath, function (err) {
      err && err.code !== 'EEXIST' ? callback(err) : self.setAttributes(fullPath, options, callback);
    });
  } catch (err) {
    return callback(err);
  }
};

module.exports = DirectoryEntry;