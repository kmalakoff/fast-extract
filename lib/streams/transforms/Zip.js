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
  self.iterator = new ZipIterator(fullPath);
  self.iterator.forEach(
    function (entry) {
      self.push(entry);
    },
    { concurrency: 1 },
    function (err) {
      if (!self.iterator) return
      err || self.push(null);
      self.iterator.destroy();
      self.iterator = null;
      self._callback ? self._callback(err) : self.end(err);
      self._callback = null;
      callback(err);
    }
  );
};

ZipTransform.prototype._flush = function _flush(callback) {
  if (!this.iterator) return callback();
  this._callback = callback;
  self.iterator.end();
};

ZipTransform.prototype.destroy = function destroy(err) {
  if (this.iterator) {
    this.iterator.destroy(err);
    this.iterator = null;
    this.end(err);
  }
}

module.exports = ZipTransform;
