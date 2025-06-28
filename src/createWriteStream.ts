import writer from './compat/flush-write-stream.ts';
import pumpify from './compat/pumpify.ts';
import rimrafAll from './compat/rimrafAll.ts';
import createPipeline from './createPipeline.ts';
import exitCleanup from './exitCleanup.ts';

import type { Options, OptionsInternal } from './types.ts';

export default function createWriteStream(dest: string, options_: Options): NodeJS.WritableStream {
  if (typeof options_ === 'string') options_ = { type: options_ };
  const options: OptionsInternal = { _tempPaths: [], ...options_ };
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
