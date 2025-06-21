import { PassThrough, Transform, type TransformCallback, type TransformOptions } from 'stream';
import TarIterator from 'tar-iterator';

import type { OptionsInternal } from '../../types.ts';

export default class TarTransform extends Transform {
  private _iterator: TarIterator;
  private _callback: (error?: Error) => void;
  private _stream: NodeJS.ReadWriteStream;

  constructor(options?: OptionsInternal | TransformOptions<Transform>) {
    options = options ? { ...options, objectMode: true } : { objectMode: true };
    super(options);
  }

  _transform(chunk: unknown, encoding: BufferEncoding, callback: TransformCallback): undefined {
    if (this._stream) {
      this._stream.write(chunk as string, encoding, callback);
      return;
    }
    this._stream = new PassThrough();
    this._iterator = new TarIterator(this._stream);
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
