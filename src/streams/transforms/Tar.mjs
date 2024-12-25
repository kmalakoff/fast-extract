import { PassThrough, Transform } from 'stream';
import util from 'util';

import TarIterator from 'tar-iterator';

function TarTransform(options) {
  if (!(this instanceof TarTransform)) return new TarTransform(options);
  options = options ? { ...options, objectMode: true } : { objectMode: true };
  Transform.call(this, options);
}

util.inherits(TarTransform, Transform);

TarTransform.prototype._transform = function _transform(chunk, encoding, callback) {
  if (this._stream) return this._stream.write(chunk, encoding, callback);
  this._stream = new PassThrough();
  this._iterator = new TarIterator(this._stream);
  this._iterator.forEach(
    (entry) => {
      this.push(entry);
    },
    { concurrency: 1 },
    (err) => {
      if (!this._iterator) return;
      err || this.push(null);
      this._stream = null;
      this._iterator.destroy();
      this._iterator = null;
      this._callback ? this._callback(err) : this.end(err);
      this._callback = null;
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
    const iterator = this._iterator;
    this._iterator = null;
    iterator.destroy(err);
    this.end(err);
  }
};

export default TarTransform;
