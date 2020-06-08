var progressStream = require('progress-stream');
var assign = require('object-assign');

module.exports = function DataProgressTransform(options) {
  var info = {};
  if (options.basename !== undefined) info.basename = options.basename;
  if (options.fullPath !== undefined) info.fullPath = options.fullPath;

  var progress = progressStream({
    // length: stats ? stats.size : 0,
    time: options.time,
  });
  progress.on('progress', function (update) {
    options.progress(assign({ progress: 'write' }, update, info));
  });
  return progress;
};
