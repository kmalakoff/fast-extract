import { Transform } from 'stream';

import ZipIterator from 'zip-iterator';

export default class ZipTransform extends Transform {
  constructor(options) {
    options = options ? { ...options, objectMode: true } : { objectMode: true };
    super(options);
  }

  _transform(chunk, _encoding, callback) {
    const fullPath = typeof chunk === 'string' ? chunk : chunk.toString();
    this._iterator = new ZipIterator(fullPath);
    this._iterator.forEach(
      (entry) => {
        this.push(entry);
      },
      { concurrency: 1 },
      (err) => {
        if (!this._iterator) return;
        err || this.push(null);
        this._iterator.destroy();
        this._iterator = null;
        this._callback ? this._callback(err) : this.end(err);
        this._callback = null;
        callback(err);
      }
    );
  }

  _flush(callback) {
    if (!this._iterator) return callback();
    this._callback = callback;
    this._iterator.end();
  }

  destroy(err) {
    if (this._iterator) {
      const iterator = this._iterator;
      this._iterator = null;
      iterator.destroy(err);
      this.end(err);
    }
  }
}