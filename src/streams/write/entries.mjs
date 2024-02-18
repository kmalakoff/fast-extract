import fs from 'fs';
import writer from 'flush-write-stream';
import Queue from 'queue-cb';

import tempSuffix from 'temp-suffix';

export default function createWriteEntriesStream(dest, options) {
  options = Object.assign({ now: new Date() }, options);

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
      queue.defer(fs.rename.bind(fs, tempDest, dest));
      let entry;
      for (let index = 0; index < links.length; index++) {
        entry = links[index];
        queue.defer(entry.create.bind(entry, dest, options));
      }
      queue.await(callback);
    }
  );
}
