var MurmurHash3 = require('imurmurhash');

// if we run inside of a worker_thread, `process.pid` is not unique
/* istanbul ignore next */
var threadId = (function getId() {
  try {
    const workerThreads = require('worker_threads');

    /// if we are in main thread, this is set to `0`
    return workerThreads.threadId;
  } catch (e) {
    // worker_threads are not available, fallback to 0
    return 0;
  }
})();

var invocations = 0;
module.exports = function tempFilename() {
  return (
    '' +
    MurmurHash3(__filename)
      .hash(String(process.pid))
      .hash(String(threadId))
      .hash(String(++invocations))
      .result()
  );
};
