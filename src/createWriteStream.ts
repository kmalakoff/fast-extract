import writer from 'flush-write-stream';
import pumpify from 'pumpify';

import createPipeline from './createPipeline.js';
import exitCleanup from './exitCleanup.js';
import rimrafAll from './rimrafAll.js';

import type { WriteOptions } from './types.js';

export default function createWriteStream(dest, options) {
  if (typeof options === 'string') options = { type: options };
  options = { _tempPaths: [], ...options } as WriteOptions;
  const streams = createPipeline(dest, options);
  const generatedFiles = [dest].concat(options._tempPaths);
  generatedFiles.forEach(exitCleanup.add);

  let error = null;
  let ended = false;
  function onError(err, callback) {
    if (error || ended) return callback(err);
    error = err;
    res.destroy(err);
    return rimrafAll(generatedFiles, (err2) => {
      generatedFiles.forEach(exitCleanup.remove);
      callback(err || err2);
    });
  }

  function onEnd(callback) {
    if (error || ended) return callback();
    ended = true;
    return rimrafAll(options._tempPaths, (err) => {
      generatedFiles.forEach(exitCleanup.remove);
      callback(err);
    });
  }

  const res = streams.length < 2 ? streams[0] : pumpify(streams);
  const write = writer(
    function write(chunk, encoding, callback) {
      res.write(chunk, encoding, (err) => {
        if (error) return; // skip if errored so will not  emit errors multiple times
        err ? onError(err, callback) : callback();
      });
    },
    function flush(callback) {
      if (error) return; // skip if errored so will not emit errors multiple times
      res.end((err) => {
        if (error) return; // skip if errored so will not emit errors multiple times
        err ? onError(err || error, callback) : onEnd(callback);
      });
    }
  );

  res.on('error', (err) => {
    onError(err, () => {
      write.destroy(err);
    });
  });

  return write;
}
