import { PassThrough, Transform } from 'extract-base-iterator';
import type { TransformCallback, TransformOptions, Transform as TransformT } from 'stream';

import type { OptionsInternal } from '../../types.ts';

interface Iterator {
  forEach(fn: (entry: unknown) => void, options: { concurrency: number }, callback: (err?: Error | null) => void): void;
  destroy(error?: Error | null): void;
}

type IteratorConstructor = new (stream: NodeJS.ReadWriteStream) => Iterator;

export default function createIteratorTransform(IteratorClass: IteratorConstructor) {
  class IteratorTransform extends Transform {
    _iterator: Iterator | null = null;
    _callback: ((error?: Error | null) => void) | null = null;
    _stream: NodeJS.ReadWriteStream | null = null;
    _concurrency: number;

    constructor(options?: OptionsInternal | TransformOptions<TransformT>) {
      const concurrency = (options as OptionsInternal)?.concurrency ?? Infinity;
      options = options ? { ...options, objectMode: true } : { objectMode: true };
      super(options);
      this._concurrency = concurrency;
    }

    _transform(chunk: unknown, encoding: BufferEncoding, callback: TransformCallback): void {
      if (this._stream) {
        this._stream.write(chunk as string, encoding, callback);
        return;
      }
      this._stream = new PassThrough();
      this._iterator = new IteratorClass(this._stream);
      const onEntry = (entry: unknown): void => {
        this.push(entry);
      };
      const onDone = (err?: Error | null): void => {
        if (!this._iterator) return;
        err || this.push(null);
        this._stream = null;
        this._iterator.destroy();
        this._iterator = null;
        this._callback ? this._callback(err) : this.end(err);
        this._callback = null;
      };
      this._iterator.forEach(onEntry, { concurrency: this._concurrency }, onDone);
      this._stream.write(chunk as string, encoding, callback);
    }

    _flush(callback: TransformCallback): void {
      if (!this._stream) return callback();
      this._callback = callback;
      this._stream.end();
      this._stream = null;
    }

    destroy(error?: Error | null): this {
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
  return IteratorTransform;
}
