// Writable stream with flush callback support for Node 0.8+

import { bufferFrom } from './buffer.ts';
import { Writable } from './stream.ts';

type Callback = (error?: Error | null) => void;
// biome-ignore lint/suspicious/noExplicitAny: Object mode allows any chunk type
type WriteFn = (this: FlushWriteStream, chunk: any, encoding: BufferEncoding, callback: Callback) => void;
type FlushFn = (callback: Callback) => void;

// Signal buffer for pre-_final Node versions
const SIGNAL_FLUSH = bufferFrom([0]);

class FlushWriteStream extends Writable {
  destroyed = false;
  pathMade?: boolean;
  private _writeFn: WriteFn;
  private _flushFn: FlushFn | undefined;

  constructor(opts: object | undefined, writeFn: WriteFn, flushFn?: FlushFn) {
    super(opts || {});
    this._writeFn = writeFn;
    this._flushFn = flushFn;
  }

  // biome-ignore lint/suspicious/noExplicitAny: Object mode allows any chunk type
  _write(chunk: any, enc: BufferEncoding, cb: Callback): void {
    if (chunk === SIGNAL_FLUSH) {
      if (this._flushFn) {
        this._flushFn(cb);
      } else {
        cb();
      }
    } else {
      this._writeFn.call(this, chunk, enc, cb);
    }
  }

  // biome-ignore lint/suspicious/noExplicitAny: Matches stream.Writable.end signature
  end(chunk?: any, enc?: any, cb?: Callback): this {
    if (!this._flushFn) return super.end(chunk, enc, cb);

    // Normalize arguments
    if (typeof chunk === 'function') [chunk, cb] = [null, chunk];
    else if (typeof enc === 'function') [enc, cb] = [null, enc];

    if (chunk) this.write(chunk);

    // Wait for SIGNAL_FLUSH write to complete before ending stream
    // biome-ignore lint/suspicious/noExplicitAny: Access internal _writableState
    if (!(this as any)._writableState.ending) {
      this.write(SIGNAL_FLUSH, () => {
        super.end(cb);
      });
      return this;
    }
    return super.end(cb);
  }

  destroy(err?: Error): this {
    if (this.destroyed) return this;
    this.destroyed = true;
    if (err) this.emit('error', err);
    this.emit('close');
    return this;
  }
}

export default function flushWriteStream(writeFn: WriteFn, flushFn?: FlushFn): FlushWriteStream;
export default function flushWriteStream(opts: object, writeFn: WriteFn, flushFn?: FlushFn): FlushWriteStream;
export default function flushWriteStream(opts: object | WriteFn, writeFn?: WriteFn | FlushFn, flushFn?: FlushFn): FlushWriteStream {
  if (typeof opts === 'function') return new FlushWriteStream(undefined, opts as WriteFn, writeFn as FlushFn);
  return new FlushWriteStream(opts, writeFn as WriteFn, flushFn);
}
