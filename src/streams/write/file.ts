import fs from 'fs';
import { safeRm } from 'fs-remove-compat';
import mkdirp from 'mkdirp-classic';
import path from 'path';
import Queue from 'queue-cb';
import type { Writable } from 'stream';
import tempSuffix from 'temp-suffix';
import writer from '../../compat/flush-write-stream.ts';
import exitCleanup from '../../exitCleanup.ts';
import writeTruncateFile from '../../writeTruncateFile.ts';

export default function createFilePipeline(dest: string, _options: object): Writable {
  const tempDest = tempSuffix(dest);
  exitCleanup.add(tempDest);

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
        queue.defer((cb) => {
          fs.rename(tempDest, dest, (err) => {
            if (!err) exitCleanup.remove(tempDest);
            cb(err);
          });
        });
      } else {
        queue.defer((cb) => {
          exitCleanup.remove(tempDest);
          writeTruncateFile(dest, (err) => {
            cb(err);
            return undefined;
          });
        });
      }
      queue.await(callback);
    }
  );
}
