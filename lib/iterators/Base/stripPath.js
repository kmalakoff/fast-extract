var path = require('path');
var compact = require('lodash.compact');

module.exports = function stripPath(relativePath, options) {
  var strip = options.strip || 0;
  if (!strip) return relativePath;
  var parts = compact(relativePath.split(path.sep));
  if (parts.length < strip) throw new Error('You cannot strip more levels than there are directories. Strip: ' + strip + '. Path: ' + relativePath);
  return parts.slice(strip).join(path.sep);
};
