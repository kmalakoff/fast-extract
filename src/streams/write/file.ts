import writer from 'flush-write-stream';
import fs from 'fs';
import mkdirp from 'mkdirp-classic';
import path from 'path';
import Queue from 'queue-cb';
import rimraf2 from 'rimraf2';
import type { Writable } from 'stream';
import tempSuffix from 'temp-suffix';
import type { OptionsInternal } from '../../types.js';
import writeTruncateFile from '../../writeTruncateFile.js';

export default function createFilePipeline(dest: string, options: object): Writable {
  const tempDest = tempSuffix(dest);
  (options as OptionsInternal)._tempPaths.push(tempDest);

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
