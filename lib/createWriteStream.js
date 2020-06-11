var assign = require('object-assign');
var writer = require('flush-write-stream');
var pumpify = require('pumpify');

var createPipeline = require('./createPipeline');
var exitCleanup = require('./exitCleanup');
var rimrafAll = require('./rimrafAll');

module.exports = function createWriteStream(dest, options) {
  if (typeof options === 'string') options = { type: options };
  options = assign({ _tempPaths: [] }, options);
  var streams = createPipeline(dest, options);

  var generatedFiles = [dest].concat(options._tempPaths);
  generatedFiles.forEach(exitCleanup.add);

  var errored = false;
  var ending = false;
  var ended = false;
  function onError(err, callback) {
    if (errored) return callback(err);
    errored = true;
    return rimrafAll(generatedFiles, function (err2) {
      generatedFiles.forEach(exitCleanup.remove);
      callback(err || err2);
    });
  }

  function onEnd(callback) {
    if (ended) return callback();
    ended = true;
    return rimrafAll(options._tempPaths, function (err) {
      generatedFiles.forEach(exitCleanup.remove);
      callback(err);
    });
  }

  var res = streams.length < 2 ? streams[0] : pumpify(streams);
  var write = writer(
    function write(chunk, encoding, callback) {
      res.write(chunk, encoding, function (err) {
        err ? onError(err, callback) : callback();
      });
    },
    function flush(callback) {
      ending = true;
      res.end(function (err) {
        err ? onError(err, callback) : onEnd(callback);
      });
    }
  );

  res.on('error', function (err) {
    var emit = ending && !errored;
    var end = !errored;
    onError(err, function (err) {
      if (emit) write.emit('error', err);
      else if (end) write.end(err);
    });
  });

  return write;
};
