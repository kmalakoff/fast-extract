import writer from 'flush-write-stream';
import fs from 'fs';
import Queue from 'queue-cb';
import rimraf2 from 'rimraf2';
import type { Writable } from 'stream';
import tempSuffix from 'temp-suffix';
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
      queue.defer(rimraf2.bind(null, dest, { disableGlob: true }));
      queue.defer(fs.rename.bind(fs, tempDest, dest));
      for (let index = 0; index < links.length; index++) {
        const entry = links[index];
        queue.defer(entry.create.bind(entry, dest, options));
      }
      queue.await(callback);
    }
  );
}
