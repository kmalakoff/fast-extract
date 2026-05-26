import { waitForAccess } from 'extract-base-iterator';
import { safeRm } from 'fs-remove-compat';
import fs from 'graceful-fs';
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
    function write(this: { pathMade?: boolean }, chunk: Buffer | string, _encoding: BufferEncoding, callback: (err?: Error | null) => void): void {
      wroteSomething = true;
      const appendFile = (): void => {
        fs.appendFile(tempDest, chunk as Buffer, callback);
      };
      if (this.pathMade) return appendFile();
      mkdirp(path.dirname(tempDest), () => {
        this.pathMade = true;
        appendFile();
      });
    },
    function flush(callback: (err?: Error | null) => void): void {
      const queue = new Queue(1);
      queue.defer((cb: (err?: Error) => void) => {
        mkdirp(path.dirname(dest), (err: Error | null) => {
          err && (err as NodeJS.ErrnoException).code !== 'EEXIST' ? cb(err) : cb();
        });
      });
      if (wroteSomething) {
        queue.defer((cb: (err?: Error) => void) => safeRm(dest, (err) => cb(err ?? undefined)));
        queue.defer((cb: (err?: Error) => void) => {
          fs.rename(tempDest, dest, (err) => {
            if (!err) exitCleanup.remove(tempDest);
            cb(err ?? undefined);
          });
        });
        queue.defer(waitForAccess.bind(null, dest));
      } else {
        queue.defer((cb: (err?: Error) => void) => {
          exitCleanup.remove(tempDest);
          writeTruncateFile(dest, cb);
        });
      }
      queue.await(callback);
    }
  );
}
