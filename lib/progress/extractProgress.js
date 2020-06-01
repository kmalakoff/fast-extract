var throttle = require('lodash.throttle');

module.exports = function extractProgress(options) {
  if (!options.progress) return function progress() {};
  var done = false;
  var progress = function progress(entry) {
    if (done) return; // throttle can call after done
    if (!entry) return (done = true);
    entry.progress = 'extract';
    options.progress(entry);
  };
  if (options.time) progress = throttle(progress, options.time, { leading: true });
  return progress;
};
