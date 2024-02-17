const rimraf = require('rimraf');
const Queue = require('queue-cb');

module.exports = function rimrafAll(fullPaths, callback) {
  if (!fullPaths.length) return callback();
  const queue = new Queue(1);
  for (let index = 0; index < fullPaths.length; index++) {
    ((fullPath) => {
      queue.defer((callback) => {
        rimraf(fullPath, (err) => {
          err && err.code !== 'ENOENT' ? callback(err) : callback();
        });
      });
    })(fullPaths[index]);
  }

  queue.await(callback);
};
