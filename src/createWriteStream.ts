import callOnce from 'call-once-fn';
import oo from 'on-one';
import writer from './compat/flush-write-stream.ts';
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

  // Get first and last streams
  const first = streams[0];
  const last = streams[streams.length - 1];

  let error = null;
  let ended = false;
  let lastFinished = false;
  let finishCallback: (() => void) | null = null;
  let errorEmittedOnWrite = false;

  // Manually pipe streams (instead of using pump which has complex completion semantics)
  for (let i = 0; i < streams.length - 1; i++) {
    streams[i].pipe(streams[i + 1]);
  }

  // Handle errors from all streams - use on-one to ensure each stream only triggers once
  let errorHandling = false;
  function handleError(err) {
    if (!err || errorHandling) return; // only handle actual errors, once
    errorHandling = true;
    error = err;
    // Emit error immediately to prevent 'finish' from being emitted (Node 12 timing issue)
    if (!errorEmittedOnWrite) {
      errorEmittedOnWrite = true;
      write.destroy(err);
    }
    // Clean up files async
    rimrafAll(generatedFiles, () => {
      generatedFiles.forEach(exitCleanup.remove);
    });
  }

  // Listen for errors on all streams (errors may not propagate through all pipe types)
  for (let i = 0; i < streams.length; i++) {
    oo(streams[i], ['error'], handleError);
  }

  // Track when last stream finishes (use on-one for cross-version compatibility)
  oo(last, ['end', 'close', 'finish'], () => {
    if (error) return; // don't complete if errored
    lastFinished = true;
    if (finishCallback) {
      finishCallback();
      finishCallback = null;
    }
  });

  function onEnd(callback) {
    if (error || ended) return callback();
    ended = true;
    return rimrafAll(options._tempPaths, (err) => {
      generatedFiles.forEach(exitCleanup.remove);
      callback(err);
    });
  }

  const write = writer(
    function write(chunk, encoding, callback) {
      if (error) return callback(error);
      first.write(chunk, encoding, (err) => {
        if (error) return; // skip if errored
        if (err) {
          error = err;
          errorEmittedOnWrite = true; // error will be emitted by Writable base class via callback
          callback(err);
        } else {
          callback();
        }
      });
    },
    function flush(callback) {
      if (error) {
        errorEmittedOnWrite = true; // error will be emitted by Writable base class via callback
        return callback(error);
      }

      // Ensure callback is only called once (race conditions on older Node)
      const cb = callOnce(callback);

      const onComplete = () => {
        if (error) return cb(error);
        onEnd(cb);
      };

      // If last already finished, complete immediately
      if (lastFinished) {
        onComplete();
      } else {
        // Wait for last stream to finish
        finishCallback = onComplete;

        // End the first stream to signal no more data - this propagates through the pipeline
        first.end();
      }
    }
  );

  // Track when error is emitted on write stream (from any source)
  write.on('error', () => {
    errorEmittedOnWrite = true;
  });

  return write;
}
