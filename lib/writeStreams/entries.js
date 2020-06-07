var writer = require('flush-write-stream');
var assign = require('object-assign');

module.exports = function createWriteEntriesStream(dest, options) {
  options = assign({ now: new Date() }, options);

  return writer({ objectMode: true }, function write(entry, encoding, callback) {
    entry.create(dest, options, callback);
  });
};
