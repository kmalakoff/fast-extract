var PassThrough = require('stream').PassThrough || require('readable-stream').PassThrough;
var writer = require('flush-write-stream');
var pumpify = require('pumpify');

var hasType = require('./hasType');
var decompressorsByType = require('./streams/transforms/decompressorsByType');
var createFilePipeline = require('./streams/pipelines/file');
var createTarPipeline = require('./streams/pipelines/tar');
var createZipPipeline = require('./streams/pipelines/zip');

module.exports = function createWriteStream(dest, options) {
  var type = options.type || '';
  var streams = decompressorsByType(type);

  if (hasType(type, 'zip')) streams = createZipPipeline(dest, streams, options);
  else if (hasType(type, 'tar') || hasType(type, 'tgz')) streams = createTarPipeline(dest, streams, options);
  else streams = createFilePipeline(dest, streams, options);

  streams.unshift(new PassThrough(options));
  var res = pumpify(streams);

  var stream = writer(
    function write(chunk, encoding, callback) {
      res.write(chunk, encoding, callback);
    },
    function flush(callback) {
      res.end(callback);
    }
  );

  res.on('error', function error(err) {
    stream.destroy(err);
  });
  return stream;
};
