var tarStream = require('tar-stream');
var util = require('util');

var BaseIterator = require('../Base');
var createEntry = require('./createEntry');

function TarIterator(stream) {
  if (!(this instanceof TarIterator)) return new TarIterator(stream);
  BaseIterator.call(this);

  var self = this;
  var extract = tarStream.extract();
  self.extract = extract;
  extract.on('entry', function (header, stream, next) {
    if (self.done) return extract.close();

    createEntry(header, stream, function (err, entry) {
      if (err || self.done) return extract.close(err);

      self.entries.push(entry);
      self.stack.push(next);
      self.resume();
    });
  });
  extract.on('error', self.end.bind(self));
  extract.on('finish', self.end.bind(self));
  !stream || stream.pipe(extract);
}

util.inherits(TarIterator, BaseIterator);

module.exports = TarIterator;
