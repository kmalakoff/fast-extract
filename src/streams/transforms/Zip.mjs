import { Transform } from 'stream';
import util from 'util';

import ZipIterator from 'zip-iterator';

function ZipTransform(options) {
  if (!(this instanceof ZipTransform)) return new ZipTransform(options);
  options = options ? { ...options, objectMode: true } : { objectMode: true };
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

export default ZipTransform;
