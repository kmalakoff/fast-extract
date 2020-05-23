var fs = require('fs');
var progressStream = require('progress-stream');

function getStats(src, callback) {
  if (typeof src !== 'string') return callback();
  fs.stat(src, callback);
}

module.exports = function (res, src, entry, options, callback) {
  if (!options.progress) return callback(null, res);

  getStats(src, function (err, stats) {
    if (err) return callback(err);

    var progress = progressStream({
      length: stats ? stats.size : 0,
      time: 1000,
    });
    progress.on('progress', function (update) {
      update.basename = entry.basename;
      update.fullPath = entry.fullPath;
      update.progress = 'write';
      options.progress(update);
    });
    res = res.pipe(progress);
    callback(null, res);
  });
};
