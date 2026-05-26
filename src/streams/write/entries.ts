import { waitForAccess } from 'extract-base-iterator';
import fs from 'fs';
import { safeRm } from 'fs-remove-compat';
import Queue from 'queue-cb';
import type { Writable } from 'stream';
import tempSuffix from 'temp-suffix';
import writer from '../../compat/flush-write-stream.ts';
import type { OptionsInternal } from '../../types.ts';

type Entry = { type: string; create: (dest: string, options: OptionsInternal, cb: (err?: Error | null) => void) => void };

export default function createWriteEntriesStream(dest: string, options: OptionsInternal = {}): Writable {
  options = { now: new Date(), ...options };

  const tempDest = tempSuffix(dest);
  const links: Entry[] = [];
  return writer(
    { objectMode: true },
    function write(entry: Entry, _encoding: BufferEncoding, callback: (err?: Error | null) => void): void {
      if (entry.type === 'link') {
        links.unshift(entry);
        return callback();
      }
      if (entry.type === 'symlink') {
        links.push(entry);
        return callback();
      }
      entry.create(tempDest, options, (err?: Error | null) => callback(err));
    },
    function flush(callback: (err?: Error | null) => void): void {
      const queue = new Queue(1);
      queue.defer((cb: (err?: Error | null) => void) => safeRm(dest, (err) => cb(err)));
      queue.defer((cb: (err?: Error | null) => void) => fs.rename(tempDest, dest, (err) => cb(err)));
      queue.defer(waitForAccess.bind(null, dest));
      for (let index = 0; index < links.length; index++) {
        const entry = links[index];
        queue.defer((cb: (err?: Error | null) => void) => {
          entry.create(dest, options, cb);
        });
      }
      queue.await(callback);
    }
  );
}
