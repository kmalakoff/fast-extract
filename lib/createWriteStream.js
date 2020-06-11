var writer = require('flush-write-stream');
var pumpify = require('pumpify');

var createFilePipeline = require('./streams/pipelines/file');
var createTarPipeline = require('./streams/pipelines/tar');
var createZipPipeline = require('./streams/pipelines/zip');
var decompressorsByType = require('./streams/transforms/decompressorsByType');
var extname = require('./extname');
var hasType = require('./hasType');
var statsBasename = require('./sourceStats/basename');

module.exports = function createWriteStream(dest, options) {
  if (typeof options === 'string') options = { type: options };
  var type = options.type === undefined ? extname(statsBasename(options.source, options) || '') : options.type;
  var streams = decompressorsByType(type);

  if (hasType(type, 'zip')) streams = createZipPipeline(dest, streams, options);
  else if (hasType(type, 'tar') || hasType(type, 'tgz')) streams = createTarPipeline(dest, streams, options);
  else streams = createFilePipeline(dest, streams, options);

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
