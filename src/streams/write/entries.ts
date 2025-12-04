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
      queue.defer((cb) => safeRm(dest, cb));
      queue.defer(fs.rename.bind(fs, tempDest, dest));
      for (let index = 0; index < links.length; index++) {
        const entry = links[index];
        queue.defer(entry.create.bind(entry, dest, options));
      }
      queue.await(callback);
    }
  );
}
