var yauzl = require('yauzl');

var DirectoryEntry = require('../../entry/Directory');
var FileEntry = require('../../entry/File');
var LinkEntry = require('../../entry/Link');

var parseExternalFileAttributes = require('./parseExternalFileAttributes');
var streamToBuffer = require('../../streamToBuffer');

module.exports = function createEntry(rawHeader, extract, callback) {
  var header = parseExternalFileAttributes(rawHeader.externalFileAttributes, rawHeader.versionMadeBy >> 8);
  header.name = rawHeader.fileName;
  header.mtime = yauzl.dosDateTimeToDate(rawHeader.lastModFileDate, rawHeader.lastModFileTime);

  switch (header.type) {
    case 'directory':
      return callback(null, new DirectoryEntry(header));
    case 'symlink':
    case 'link':
      return extract.openReadStream(rawHeader, function (err, stream) {
        if (err) return callback(err);

        streamToBuffer(stream, function (err, buffer) {
          if (err) return callback(err);
          header.linkname = buffer.toString();
          callback(null, new LinkEntry(header));
        });
      });
    case 'file':
      return extract.openReadStream(rawHeader, function (err, stream) {
        err ? callback(err) : callback(null, new FileEntry(header, stream));
      });
  }

  return callback(new Error('Unrecognized entry type: ' + header.type));
};
