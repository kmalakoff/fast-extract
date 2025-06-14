import { Transform, type TransformCallback, type TransformOptions } from 'stream';
import ZipIterator from 'zip-iterator';

import type { OptionsInternal } from '../../types.js';

export default class ZipTransform extends Transform {
  private _iterator: ZipIterator;
  private _callback: (error?: Error) => void;

  constructor(options?: OptionsInternal | TransformOptions<Transform>) {
    options = options ? { ...options, objectMode: true } : { objectMode: true };
    super(options);
  }

  _transform(chunk: unknown, _encoding: BufferEncoding, callback: TransformCallback): undefined {
    const fullPath = typeof chunk === 'string' ? chunk : chunk.toString();
    this._iterator = new ZipIterator(fullPath);
    this._iterator.forEach(
      (entry: unknown): undefined => {
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

  _flush(callback: TransformCallback): undefined {
    if (!this._iterator) {
      callback();
      return;
    }
    this._callback = callback;
    this._iterator.end();
  }

  destroy(error?: Error): this {
    if (this._iterator) {
      const iterator = this._iterator;
      this._iterator = null;
      iterator.destroy(error);
      this.end(error);
    }
    return this;
  }
}
