var writer = require('flush-write-stream');
var assign = require('object-assign');
var Queue = require('queue-cb');
var fs = require('fs');

var tempSuffix = require('temp-suffix');

module.exports = function createWriteEntriesStream(dest, options) {
  options = assign({ now: new Date() }, options);

  var tempDest = tempSuffix(dest);
  var links = [];
  return writer(
    { objectMode: true },
    function write(entry, encoding, callback) {
      if (entry.type === 'link') {
        links.unshift(entry);
        return callback();
      } else if (entry.type === 'symlink') {
        links.push(entry);
        return callback();
      }
      entry.create(tempDest, options, callback);
    },
    function flush(callback) {
      var queue = new Queue(1);
      queue.defer(fs.rename.bind(fs, tempDest, dest));
      var entry;
      for (var index = 0; index < links.length; index++) {
        entry = links[index];
        queue.defer(entry.create.bind(entry, dest, options));
      }
      queue.await(callback);
    }
  );
};
