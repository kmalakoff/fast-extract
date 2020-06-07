var path = require('path');
var compact = require('lodash.compact');

function BaseEntry(header) {
  this.platform = header.platform;
  this.mode = header.mode;
  this.uid = header.uid;
  this.gid = header.gid;
  this.mtime = new Date(header.mtime);
  this.type = header.type;
  var parts = compact(header.name.split('/'));
  this.basename = parts.length ? parts[parts.length - 1] : '';
  this.path = parts.join(path.sep);
}

module.exports = BaseEntry;
