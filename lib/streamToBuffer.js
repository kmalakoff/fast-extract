var once = require('once');

module.exports = function streamToBuffer(stream, callback) {
  callback = once(callback);

  var chunks = [];
  stream.on('data', function (chunk) {
    chunks.push(chunk);
  });
  stream.on('error', callback);
  stream.on('end', function () {
    callback(null, Buffer.concat(chunks));
  });
};
