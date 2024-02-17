const Transform = require('stream').Transform;
const util = require('util');

const ZipIterator = require('zip-iterator');

function ZipTransform(options) {
  if (!(this instanceof ZipTransform)) return new ZipTransform(options);
  options = Object.assign({ objectMode: true }, options || {});
  Transform.call(this, options);
}

util.inherits(ZipTransform, Transform);

ZipTransform.prototype._transform = function _transform(chunk, _encoding, callback) {
  const fullPath = typeof chunk === 'string' ? chunk : chunk.toString();
  this._iterator = new ZipIterator(fullPath);
  this._iterator.forEach(this.push.bind(this), { concurrency: 1 }, (err) => {
    if (!this._iterator) return;
    err || this.push(null);
    this._iterator.destroy();
    this._iterator = null;
    this._callback ? this._callback(err) : this.end(err);
    this._callback = null;
    callback(err);
  });
};

ZipTransform.prototype._flush = function _flush(callback) {
  if (!this._iterator) return callback();
  this._callback = callback;
  this._iterator.end();
};

ZipTransform.prototype.destroy = function destroy(err) {
  if (this._iterator) {
    const iterator = this._iterator;
    this._iterator = null;
    iterator.destroy(err);
    this.end(err);
  }
};

module.exports = ZipTransform;
