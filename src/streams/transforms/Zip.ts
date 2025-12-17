import type { TransformCallback, TransformOptions, Transform as TransformT } from 'stream';
import ZipIterator from 'zip-iterator';
import { PassThrough, Transform } from '../../compat/stream.ts';

import type { OptionsInternal } from '../../types.ts';

export default class ZipTransform extends Transform {
  private _iterator: ZipIterator;
  private _callback: (error?: Error) => void;
  private _stream: NodeJS.ReadWriteStream;

  constructor(options?: OptionsInternal | TransformOptions<TransformT>) {
    options = options ? { ...options, objectMode: true } : { objectMode: true };
    super(options);
  }

  _transform(chunk: unknown, encoding: BufferEncoding, callback: TransformCallback): undefined {
    if (this._stream) {
      this._stream.write(chunk as string, encoding, callback);
      return;
    }
    this._stream = new PassThrough();
    this._iterator = new ZipIterator(this._stream);
    this._iterator.forEach(
      (entry: unknown): undefined => {
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
    this._stream.write(chunk as string, encoding, callback);
  }

  _flush(callback: TransformCallback): undefined {
    if (!this._stream) {
      callback();
      return;
    }
    this._callback = callback;
    this._stream.end();
    this._stream = null;
  }

  destroy(error?: Error): this {
    if (this._stream) {
      this._stream.end();
      this._stream = null;
    }
    if (this._iterator) {
      const iterator = this._iterator;
      this._iterator = null;
      iterator.destroy(error);
      this.end(error);
    }
    return this;
  }
}
