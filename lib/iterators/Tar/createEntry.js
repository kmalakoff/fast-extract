var DirectoryEntry = require('../Base/entry/Directory');
var FileEntry = require('../Base/entry/File');
var LinkEntry = require('../Base/entry/Link');

module.exports = function createEntry(header, stream, callback) {
  switch (header.type) {
    case 'directory':
      stream.resume(); // drain stream
      return callback(null, new DirectoryEntry(header));
    case 'symlink':
    case 'link':
      stream.resume(); // drain stream
      return callback(null, new LinkEntry(header));
    case 'file':
      return callback(null, new FileEntry(header, stream));
  }

  stream.resume(); // drain stream
  return callback(new Error('Unrecognized entry type: ' + header.type));
};
