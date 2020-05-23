var once = require('once');

module.exports = function drainStream(stream, callback) {
  callback = once(callback);

  stream.on('data', function () {});
  stream.on('error', callback);
  stream.on('end', function () {
    callback();
  });
};
