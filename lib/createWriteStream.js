var PassThrough = require('stream').PassThrough || require('readable-stream').PassThrough;
var writer = require('flush-write-stream');
var pumpify = require('pumpify');
var eos = require('end-of-stream');

var hasType = require('./hasType');
var decompressorsByType = require('./streams/transforms/decompressorsByType');
var createFilePipeline = require('./streams/pipelines/file');
var createTarPipeline = require('./streams/pipelines/tar');
var createZipPipeline = require('./streams/pipelines/zip');

function pipeline(res, streams) {
  var next = res;
  for (var index = 0; index < streams.length; index++) {
    var stream = streams[index];
    stream.on('error', function (err) {
      res.emit('error', err);
    });
    next = next.pipe(stream);
  }
  return res;
}

// function propagateErrors(from, to) {
//   from.on('error', function (err) {
//     to.emit('error', err);
//   });
//   return from;
//   // return from.pipe(to);
// }

module.exports = function createWriteStream(dest, options) {
  var type = options.type || '';
  var streams = decompressorsByType(type);

  if (hasType(type, 'zip')) streams = createZipPipeline(dest, streams, options);
  else if (hasType(type, 'tar') || hasType(type, 'tgz')) streams = createTarPipeline(dest, streams, options);
  else streams = createFilePipeline(dest, streams, options);

  // var res = new PassThrough(options);
  // [res].concat(streams).reduce(propagateErrors);
  var res = streams.length > 1 ? pumpify(streams) : streams[0];
  // res = pipeline(res, streams);

  var stream = writer(
    function write(chunk, encoding, callback) {
      res.write(chunk, encoding, callback);
    },
    function flush(callback) {
      res.end(callback);
    }
  );
  res.on('error', stream.destroy.bind(stream));
  return stream;
};
