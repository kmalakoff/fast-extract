var Transform = require('stream').Transform || require('readable-stream').Transform;
var util = require('util');
var writer = require('flush-write-stream');
var tarStream = require('tar-stream');
var assign = require('object-assign');
var pumpify = require('pumpify');

var createEntry = require('./createEntry');
var extractProgress = require('../../progress/extractProgress');
var LinksEntry = require('../../entry/Links');

function TarStream(options) {
  if (!(this instanceof TarStream)) return new TarStream();
  Transform.call(this, { objectMode: true });
  var self = this;

  var extract = tarStream.extract();
  var links = new LinksEntry();

  extract.on('entry', function (header, stream, callback) {
    createEntry(header, stream, function (err, entry) {
      if (err) return callback(err);

      if (entry.type === 'link' || entry.type === 'symlink') {
        links.push(entry);
        return callback();
      }
      self.push(entry);
      callback();
    });
  });

  extract.on('error', function (err) {
    return self.end(err);
  });

  extract.on('finish', function () {
    self.push(links);
    return self.push(null);
  });
  this.extract = extract;
}

util.inherits(TarStream, Transform);

TarStream.prototype._transform = function (chunk, enc, callback) {
  this.extract.write(chunk, enc, callback);
};

TarStream.prototype._flush = function (callback) {
  this.extract.end(callback);
};

module.exports = function createWriteFileStream(dest, transforms, options) {
  options = assign({ now: new Date() }, options, { progress: extractProgress(options) });
  transforms = transforms.concat([
    new TarStream(options),
    writer({ objectMode: true }, function write(entry, enc, callback) {
      entry.create(dest, options, callback);
    }),
  ]);
  return pumpify(transforms);
};
