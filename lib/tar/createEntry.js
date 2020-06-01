var path = require('path');

module.exports = function createEntry(header) {
  var entry = {
    mode: header.mode & ~process.umask(),
    mtime: new Date(header.mtime),
    type: header.type,
  };
  var parts = header.name.split('/');
  entry.basename = parts.pop();
  entry.path = parts.join(path.sep);
  if (entry.type === 'symlink' || entry.type === 'link') entry.linkname = header.linkname;
  return entry;
};