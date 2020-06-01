var path = require('path');

module.exports = function createEntry(header, dest, extract, options, callback) {
  var strip = options.strip || 0;
  var entry = {
    mode: header.mode & ~process.umask(),
    mtime: new Date(header.mtime),
    type: header.type,
  };
  var parts = header.name.split('/');
  entry.basename = parts.pop();
  if (parts.length < strip) return callback(new Error('You cannot strip more levels than there are directories'));
  parts = parts.slice(strip);
  entry.path = parts.join(path.sep);
  entry.fullPath = path.join(dest, entry.path, entry.basename);

  if (entry.type === 'symlink' || entry.type === 'link') {
    entry.targetPath = path.join(dest, entry.path, header.linkname);
  }
  callback(null, entry);
};
