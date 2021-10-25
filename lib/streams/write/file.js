var path = require('path');
var fs = require('fs');
var mkpath = require('mkpath');
var writer = require('flush-write-stream');
var Queue = require('queue-cb');

var tempSuffix = require('temp-suffix');
var writeTruncateFile = require('../../writeTruncateFile');

module.exports = function createFilePipeline(dest, options) {
  var tempDest = tempSuffix(dest);
  options._tempPaths.push(tempDest);

  var wroteSomething = false;
  return writer(
    function write(chunk, encoding, callback) {
      wroteSomething = true;
      var self = this;
      var appendFile = fs.appendFile.bind(fs, tempDest, chunk, callback);
      if (self.pathMade) return appendFile();
      mkpath(path.dirname(tempDest), function () {
        self.pathMade = true;
        appendFile();
      });
    },
    function flush(callback) {
      var queue = new Queue(1);
      queue.defer(function (callback) {
        mkpath(path.dirname(dest), function (err) {
          err && err.code !== 'EEXIST' ? callback(err) : callback();
        });
      });
      wroteSomething ? queue.defer(fs.rename.bind(fs, tempDest, dest)) : queue.defer(writeTruncateFile.bind(null, dest));
      queue.await(callback);
    }
  );
};
