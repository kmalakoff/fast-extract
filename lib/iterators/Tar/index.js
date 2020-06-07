var tarStream = require('tar-stream');
var eos = require('end-of-stream');
var util = require('util');

var BaseIterator = require('../Base');
var createEntry = require('./createEntry');
var drainStack = require('../Base/drainStack');

function TarIterator(stream) {
  if (!(this instanceof TarIterator)) return new TarIterator(stream);
  BaseIterator.call(this);

  var self = this;
  var extract = tarStream.extract();
  self.extract = extract;

  extract.on('entry', function (header, stream, callback) {
    if (self.done) return extract.close();

    createEntry(header, stream, function (err, entry) {
      if (err || self.done) return extract.close(err);

      if (entry.type === 'link' || entry.type === 'symlink') {
        self.links.unshift(entry);
        callback();
      } else {
        self.entries.push(entry);
        self.stack.push(callback);
        drainStack(self);
      }
    });
  });

  function onError(err) {
    self.entries.clear();
    self.entries.push({ error: err });
    drainStack(self);
    if (self.entries.length) return;
    self.done = true;
    while (self.processors.length) self.processors.pop()(true);
    while (self.queued.length) self.queued.pop()(null, null);
  }

  function onFinish() {
    if (self.done) return;
    while (self.links.length) self.entries.push(self.links.pop());
    drainStack(self);
    if (self.entries.length) return;
    self.done = true;
    while (self.processors.length) self.processors.pop()(true);
    while (self.queued.length) self.queued.pop()(null, null);
  }

  if (stream) {
    eos(stream.pipe(extract), function (err) {
      err ? onError(err) : onFinish();
    });
  } else {
    extract.on('error', onError);
    extract.on('finish', onFinish);
  }
}

util.inherits(TarIterator, BaseIterator);

TarIterator.prototype.write = function write(chunk, encoding, callback) {
  this.extract.write(chunk, encoding, callback);
};

TarIterator.prototype.end = function end(callback) {
  this.extract.end(callback);
};

module.exports = TarIterator;
