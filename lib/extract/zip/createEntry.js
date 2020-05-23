var path = require('path');
var zipUtils = require('./zipUtils');

module.exports = function createEntry(header) {
  var entry = zipUtils.parseExternalFileAttributes(header.externalFileAttributes);
  entry.mtime = zipUtils.convertDateTime(header.lastModFileDate, header.lastModFileTime);

  var parts = header.fileName.split('/');
  entry.basename = parts.pop();
  entry.path = parts.join(path.sep);
  if (entry.type === 'symlink' || entry.type === 'link') entry.linkname = header.linkname;
  return entry;
};
