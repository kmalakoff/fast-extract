import fs from 'fs';
import path from 'path';
import writer from 'flush-write-stream';
import mkdirp from 'mkdirp-classic';
import Queue from 'queue-cb';
import rimraf2 from 'rimraf2';

import tempSuffix from 'temp-suffix';
import writeTruncateFile from '../../writeTruncateFile.js';

import type { WriteOptions } from '../../types.js';

export default function createFilePipeline(dest: string, options: object) {
  const tempDest = tempSuffix(dest);
  (options as WriteOptions)._tempPaths.push(tempDest);

  let wroteSomething = false;
  return writer(
    function write(chunk, _encoding, callback) {
      wroteSomething = true;
      const appendFile = fs.appendFile.bind(fs, tempDest, chunk, callback);
      if (this.pathMade) return appendFile();
      mkdirp(path.dirname(tempDest), () => {
        this.pathMade = true;
        appendFile();
      });
    },
    function flush(callback) {
      const queue = new Queue(1);
      queue.defer((callback) => {
        mkdirp(path.dirname(dest), (err) => {
          err && err.code !== 'EEXIST' ? callback(err) : callback();
        });
      });
      if (wroteSomething) {
        queue.defer(rimraf2.bind(null, dest, { disableGlob: true }));
        queue.defer(fs.rename.bind(fs, tempDest, dest));
      } else queue.defer(writeTruncateFile.bind(null, dest));
      queue.await(callback);
    }
  );
}
