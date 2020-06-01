var path = require('path');

var zipUtils = require('./zipUtils');
var streamToBuffer = require('../streamToBuffer');

module.exports = function createEntry(header, dest, extract, options, callback) {
  var strip = options.strip || 0;
  var entry = zipUtils.parseExternalFileAttributes(header.externalFileAttributes, header.versionMadeBy >> 8);
  entry.type = entry.type.toLowerCase();
  entry.mtime = zipUtils.convertDateTime(header.lastModFileDate, header.lastModFileTime);
  entry.mode = entry.mode & ~process.umask();

  var parts = header.fileName.split('/');
  entry.basename = parts.pop();
  if (parts.length < strip) return callback(new Error('You cannot strip more levels than there are directories'));
  parts = parts.slice(strip);
  entry.path = parts.join(path.sep);
  entry.fullPath = path.join(dest, entry.path, entry.basename);

  if (entry.type === 'symlink' || entry.type === 'link') {
    return extract.openReadStream(header, function (err, stream) {
      if (err) return callback(err);

      streamToBuffer(stream, function (err, buffer) {
        if (err) return callback(err);
        entry.targetPath = path.join(dest, entry.path, buffer.toString());
        callback(null, entry);
      });
    });
  }

  callback(null, entry);
};
