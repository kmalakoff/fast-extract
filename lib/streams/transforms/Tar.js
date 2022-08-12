var Transform = require('stream').Transform;
var PassThrough = require('stream').PassThrough;
var util = require('util');

var TarIterator = require('tar-iterator');

function TarTransform(options) {
  if (!(this instanceof TarTransform)) return new TarTransform(options);
  options = Object.assign({ objectMode: true }, options || {});
  Transform.call(this, options);
}

util.inherits(TarTransform, Transform);

TarTransform.prototype._transform = function _transform(chunk, encoding, callback) {
  if (this._stream) return this._stream.write(chunk, encoding, callback);

  var self = this;
  this._stream = new PassThrough();
  this._iterator = new TarIterator(this._stream);
  this._iterator.forEach(
    function (entry) {
      self.push(entry);
    },
    { concurrency: 1 },
    function (err) {
      if (!self._iterator) return;
      err || self.push(null);
      self._stream = null;
      self._iterator.destroy();
      self._iterator = null;
      self._callback ? self._callback(err) : self.end(err);
      self._callback = null;
    }
  );
  this._stream.write(chunk, encoding, callback);
};

TarTransform.prototype._flush = function _flush(callback) {
  if (!this._stream) return callback();
  this._callback = callback;
  this._stream.end();
  this._stream = null;
};

TarTransform.prototype.destroy = function destroy(err) {
  if (this._stream) {
    this._stream.end(err);
    this._stream = null;
  }
  if (this._iterator) {
    var iterator = this._iterator;
    this._iterator = null;
    iterator.destroy(err);
    this.end(err);
  }
};

module.exports = TarTransform;
