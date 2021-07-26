var Transform = require('stream').Transform || require('readable-stream').Transform;
var util = require('util');
var assign = require('object-assign');

var ZipIterator = require('zip-iterator');

function ZipTransform(options) {
  if (!(this instanceof ZipTransform)) return new ZipTransform(options);
  options = options ? assign({}, options, { objectMode: true }) : { objectMode: true };
  Transform.call(this, options);
}

util.inherits(ZipTransform, Transform);

ZipTransform.prototype._transform = function _transform(chunk, encoding, callback) {
  var fullPath = typeof chunk === 'string' ? chunk : chunk.toString();

  var self = this;
  this._iterator = new ZipIterator(fullPath);
  this._iterator.forEach(
    function (entry) {
      self.push(entry);
    },
    { concurrency: 1 },
    function (err) {
      if (!self._iterator) return;
      err || self.push(null);
      self._iterator.destroy();
      self._iterator = null;
      self._callback ? self._callback(err) : self.end(err);
      self._callback = null;
      callback(err);
    }
  );
};

ZipTransform.prototype._flush = function _flush(callback) {
  if (!this._iterator) return callback();
  this._callback = callback;
  this._iterator.end();
};

ZipTransform.prototype.destroy = function destroy(err) {
  if (this._iterator) {
    var iterator = this._iterator;
    this._iterator = null;
    iterator.destroy(err);
    this.end(err);
  }
};

module.exports = ZipTransform;
