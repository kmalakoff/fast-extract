const path = require('path');
const fs = require('fs');
const mkpath = require('mkpath');
const writer = require('flush-write-stream');
const Queue = require('queue-cb');

const tempSuffix = require('temp-suffix');
const writeTruncateFile = require('../../writeTruncateFile.cjs');

module.exports = function createFilePipeline(dest, options) {
  const tempDest = tempSuffix(dest);
  options._tempPaths.push(tempDest);

  let wroteSomething = false;
  return writer(
    function write(chunk, _encoding, callback) {
      wroteSomething = true;
      const appendFile = fs.appendFile.bind(fs, tempDest, chunk, callback);
      if (this.pathMade) return appendFile();
      mkpath(path.dirname(tempDest), () => {
        this.pathMade = true;
        appendFile();
      });
    },
    function flush(callback) {
      const queue = new Queue(1);
      queue.defer((callback) => {
        mkpath(path.dirname(dest), (err) => {
          err && err.code !== 'EEXIST' ? callback(err) : callback();
        });
      });
      wroteSomething ? queue.defer(fs.rename.bind(fs, tempDest, dest)) : queue.defer(writeTruncateFile.bind(null, dest));
      queue.await(callback);
    }
  );
};
