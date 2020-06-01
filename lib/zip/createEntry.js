var path = require('path');
var zipUtils = require('./zipUtils');

module.exports = function createEntry(header) {
  var entry = zipUtils.parseExternalFileAttributes(header.externalFileAttributes, header.versionMadeBy >> 8);
  entry.type = entry.type.toLowerCase();
  entry.mtime = zipUtils.convertDateTime(header.lastModFileDate, header.lastModFileTime);
  entry.mode = entry.mode & ~process.umask();

  var parts = header.fileName.split('/');
  entry.basename = parts.pop();
  entry.path = parts.join(path.sep);
  return entry;
};
