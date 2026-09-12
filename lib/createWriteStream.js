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

  var error = null;
  var ended = false;
  function onError(err, callback) {
    if (error || ended) return callback(err);
    error = err;
    res.destroy(err);
    return rimrafAll(generatedFiles, function (err2) {
      generatedFiles.forEach(exitCleanup.remove);
      callback(err || err2);
    });
  }

  function onEnd(callback) {
    if (error || ended) return callback();
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
        if (error) return; // skip if errored so will not  emit errors multiple times
        err ? onError(err, callback) : callback();
      });
    },
    function flush(callback) {
      if (error) return; // skip if errored so will not emit errors multiple times
      res.end(function (err) {
        if (error) return; // skip if errored so will not emit errors multiple times
        err ? onError(err || error, callback) : onEnd(callback);
      });
    }
  );

  res.on('error', function (err) {
    onError(err, function () {
      write.destroy(err);
    });
  });

  return write;
};
