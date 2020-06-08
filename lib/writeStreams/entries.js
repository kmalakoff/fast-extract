var writer = require('flush-write-stream');
var assign = require('object-assign');
var Queue = require('queue-cb');
var rimraf = require('rimraf');
var fs = require('fs');

var tempSuffix = require('../tempSuffix');

module.exports = function createWriteEntriesStream(dest, options) {
  options = assign({ now: new Date() }, options);

  var tempDest = tempSuffix(dest);
  var links = [];

  return writer(
    { objectMode: true },
    function write(entry, encoding, callback) {
      if (entry.type === 'link' || entry.type === 'symlink') {
        links.push(entry);
        return callback();
      }
      entry.create(tempDest, options, callback);
    },
    function flush(callback) {
      var queue = new Queue(1);
      queue.defer(function (callback) {
        rimraf(dest, function (err) {
          err && err.code !== 'EEXIST' ? callback(err) : callback();
        });
      });
      queue.defer(fs.rename.bind(fs, tempDest, dest));
      for (var index = 0; index < links.length; index++) {
        (function (entry) {
          queue.defer(entry.create.bind(entry, dest, options));
        })(links[index]);
      }
      queue.await(callback);
    }
  );
};
