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
  var type = options.type === undefined ? extname(statsBasename(options.source, options) || '') : options.type;
  var streams = decompressorsByType(type);

  if (hasType(type, 'zip')) streams = createZipPipeline(dest, streams, options);
  else if (hasType(type, 'tar') || hasType(type, 'tgz')) streams = createTarPipeline(dest, streams, options);
  else streams = createFilePipeline(dest, streams, options);

  var errorPropagated = null;
  var res = streams.length < 2 ? streams[0] : pumpify(streams);
  var write = writer(
    function write(chunk, encoding, callback) {
      res.write(chunk, encoding, function (err) {
        if (err) errorPropagated = true;
        callback(err);
      });
    },
    function flush(callback) {
      res.end(function (err) {
        if (err) errorPropagated = true;
        callback(err);
      });
    }
  );

  res.on('error', function (err) {
    if (!errorPropagated) write.end(err);
  });

  return write;
};
