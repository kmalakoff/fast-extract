var progressStream = require('progress-stream');
var assign = require('object-assign');
var statsSize = require('../../sourceStats/size');

module.exports = function DataProgressTransform(options) {
  var stats = { basename: options.basename };
  var progress = progressStream(
    {
      time: options.time,
    },
    function (update) {
      options.progress(assign({ progress: 'write' }, update, stats));
    }
  );

  statsSize(options.source, options, function (err, size) {
    err || progress.setLength(size || 0);
  });
  return progress;
};
