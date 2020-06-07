var path = require('path');
var compact = require('lodash.compact');

var chperm = require('../fs/chperm');
var utimes = require('../fs/utimes');

function BaseEntry(header) {
  this.platform = header.platform;
  this.mode = header.mode;
  this.mtime = new Date(header.mtime);
  this.type = header.type;
  var parts = compact(header.name.split('/'));
  this.basename = parts.length ? parts[parts.length - 1] : '';
  this.path = parts.join(path.sep);
}

BaseEntry.prototype.setAttributes = function setAttributes(fullPath, options, callback) {
  var self = this;
  utimes(fullPath, this, options, function (err) {
    err ? callback(err) : chperm(fullPath, self, callback);
  });
};

module.exports = BaseEntry;
