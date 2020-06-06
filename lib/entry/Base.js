var path = require('path');
var fs = require('fs');

function BaseEntry(header) {
  this.platform = header.platform;
  this.mode = header.mode & ~process.umask();
  this.mtime = new Date(header.mtime);
  this.type = header.type;
  var parts = header.name.split('/');
  this.basename = parts[0] || '';
  this.path = parts.join(path.sep);
}

BaseEntry.prototype.setAttributes = function setAttributes(fullPath, options, callback) {
  var now = options.now || new Date();
  var self = this;
  fs.chmod(fullPath, this.mode, function (err) {
    if (err) return callback(err);
    fs.utimes(fullPath, now, self.mtime, callback);
  });
};

module.exports = BaseEntry;
