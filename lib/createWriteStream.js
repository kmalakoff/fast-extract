var writer = require('flush-write-stream');
var pumpify = require('pumpify');

var createPipeline = require('./createPipeline');

module.exports = function createWriteStream(dest, options) {
  var streams = createPipeline(dest, options);

  var errored = false;
  var ending = false;
  var ended = false;
  function on(err, callback) {
    if (errored) return callback(err);
    errored = true;
    // TODO: add cleanup
    return callback(err);
  }

  function onEnd(callback) {
    if (ended) return callback();
    ended = true;
    // TODO: add cleanup
    return callback();
  }

  var res = streams.length < 2 ? streams[0] : pumpify(streams);
  var write = writer(
    function write(chunk, encoding, callback) {
      res.write(chunk, encoding, function (err) {
        err ? on(err, callback) : callback();
      });
    },
    function flush(callback) {
      ending = true;
      res.end(function (err) {
        err ? on(err, callback) : onEnd(callback);
      });
    }
  );

  res.on('error', function (err) {
    var emit = ending && !errored;
    var end = !errored;
    on(err, function (err) {
      if (emit) write.emit('error', err);
      else if (end) write.end(err);
    });
  });

  return write;
};
