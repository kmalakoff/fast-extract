var eos = require('end-of-stream');

module.exports = function streamToBuffer(stream, callback) {
  var chunks = [];
  stream.on('data', function (chunk) {
    chunks.push(chunk);
  });
  eos(stream, function (err) {
    err ? callback(err) : callback(null, Buffer.concat(chunks));
  });
};
