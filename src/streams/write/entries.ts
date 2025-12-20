import { waitForAccess } from 'extract-base-iterator';
import fs from 'fs';
import { safeRm } from 'fs-remove-compat';
import Queue from 'queue-cb';
import type { Writable } from 'stream';
import tempSuffix from 'temp-suffix';
import writer from '../../compat/flush-write-stream.ts';
import type { OptionsInternal } from '../../types.ts';

export default function createWriteEntriesStream(dest: string, options: OptionsInternal = {}): Writable {
  options = { now: new Date(), ...options };

  const tempDest = tempSuffix(dest);
  const links = [];
  return writer(
    { objectMode: true },
    function write(entry, _encoding, callback) {
      if (entry.type === 'link') {
        links.unshift(entry);
        return callback();
      }
      if (entry.type === 'symlink') {
        links.push(entry);
        return callback();
      }
      entry.create(tempDest, options, callback);
    },
    function flush(callback) {
      const queue = new Queue(1);
      queue.defer(safeRm.bind(null, dest));
      queue.defer(fs.rename.bind(null, tempDest, dest));
      queue.defer(waitForAccess.bind(null, dest));
      for (let index = 0; index < links.length; index++) {
        const entry = links[index];
        queue.defer((cb) => {
          entry.create(dest, options, cb);
        });
      }
      queue.await(callback);
    }
  );
}
