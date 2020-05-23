var path = require('path');

module.exports = function createEntry(header) {
  var entry = {
    mode: header.mode,
    mtime: header.mtime,
    type: header.type,
  };
  var parts = header.name.split('/');
  entry.basename = parts.pop();
  entry.path = parts.join(path.sep);
  if (header.type === 'symlink' || header.type === 'link') entry.linkname = header.linkname;
  return entry;
};
