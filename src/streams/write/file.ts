import fs from 'fs';
import { safeRm } from 'fs-remove-compat';
import mkdirp from 'mkdirp-classic';
import path from 'path';
import Queue from 'queue-cb';
import type { Writable } from 'stream';
import tempSuffix from 'temp-suffix';
import writer from '../../compat/flush-write-stream.ts';
import type { OptionsInternal } from '../../types.ts';
import writeTruncateFile from '../../writeTruncateFile.ts';

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
        queue.defer((cb) => safeRm(dest, cb));
        queue.defer(fs.rename.bind(fs, tempDest, dest));
      } else queue.defer(writeTruncateFile.bind(null, dest));
      queue.await(callback);
    }
  );
}
