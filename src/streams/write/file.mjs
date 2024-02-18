import fs from 'fs';
import path from 'path';
import writer from 'flush-write-stream';
import mkpath from 'mkpath';
import Queue from 'queue-cb';

import tempSuffix from 'temp-suffix';
import writeTruncateFile from '../../writeTruncateFile.mjs';

export default function createFilePipeline(dest, options) {
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
}
