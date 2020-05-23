var path = require('path');

module.exports = function createEntry(header, dest, options, callback) {
  var entry = {
    mode: header.mode,
    mtime: header.mtime,
    type: header.type,
  };
  var parts = header.name.split('/');
  if (options.strip > parts.length) throw new Error('You cannot strip more levels than there are directories');
  parts = parts.slice(options.strip);

  entry.basename = parts.pop();
  entry.path = parts.join(path.sep);
  if (header.type === 'symlink' || header.type === 'link') entry.linkname = header.linkname;
  entry.fullPath = path.join(dest, entry.path, entry.basename);
  return entry;
};
