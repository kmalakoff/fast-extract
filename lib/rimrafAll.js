var rimraf = require('rimraf');
var Queue = require('queue-cb');

module.exports = function rimrafAll(fullPaths, callback) {
  if (!fullPaths.length) return callback();
  var queue = new Queue(1);
  for (var index = 0; index < fullPaths.length; index++) {
    (function (fullPath) {
      queue.defer(function (callback) {
        rimraf(fullPath, function (err) {
          err && err.code !== 'ENOENT' ? callback(err) : callback();
        });
      });
    })(fullPaths[index]);
  }

  queue.await(callback);
};
