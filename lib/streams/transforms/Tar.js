var Transform = require('stream').Transform || require('readable-stream').Transform;
var PassThrough = require('stream').PassThrough || require('readable-stream').PassThrough;
var util = require('util');
var assign = require('object-assign');

var TarIterator = require('tar-iterator');

function TarTransform(options) {
  if (!(this instanceof TarTransform)) return new TarTransform(options);
  options = options ? assign({}, options, { objectMode: true }) : { objectMode: true };
  Transform.call(this, options);
}

util.inherits(TarTransform, Transform);

TarTransform.prototype._transform = function _transform(chunk, encoding, callback) {
  if (this.stream) return this.stream.write(chunk, encoding, callback);

  var self = this;
  self.stream = new PassThrough();
  self.iterator = new TarIterator(self.stream);
  self.iterator.forEach(
    function (entry) {
      self.push(entry);
    },
    { concurrency: 1 },
    function (err) {
      if (!self.iterator) return;
      err || self.push(null);
      self.stream = null;
      self.iterator.destroy();
      self.iterator = null;
      self._callback ? self._callback(err) : self.end(err);
      self._callback = null;
    }
  );
  self.stream.write(chunk, encoding, callback);
};

TarTransform.prototype._flush = function _flush(callback) {
  if (!this.stream) return callback();
  this._callback = callback;
  this.stream.end();
  this.stream = null;
};

TarTransform.prototype.destroy = function destroy(err) {
  if (this.stream) {
    this.stream.end(err);
    this.stream = null;
  }
  if (this.iterator) {
    this.iterator.destroy(err);
    this.iterator = null;
    this.end(err);
  }
};

module.exports = TarTransform;
