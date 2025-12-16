// Inspired by flush-write-stream (https://github.com/mafintosh/flush-write-stream) by Mathias Buus
import type Stream from 'stream';
import util from 'util';
import { bufferFrom } from './buffer.ts';
import { Writable } from './stream.ts';

type WriteCallback = (error?: Error | null) => void;
// biome-ignore lint/suspicious/noExplicitAny: Object mode allows any chunk type
type WriteFn = (this: FlushWriteStream, chunk: any, encoding: BufferEncoding, callback: WriteCallback) => void;
type FlushFn = (callback: WriteCallback) => void;

interface WriteStreamOptions {
  objectMode?: boolean;
  highWaterMark?: number;
  decodeStrings?: boolean;
  defaultEncoding?: BufferEncoding;
}

interface FlushWriteStream extends Stream.Writable {
  destroyed: boolean;
  _worker: WriteFn | null;
  _flush: FlushFn | null;
  pathMade?: boolean;
}

interface WriteStreamConstructor {
  (write: WriteFn, flush?: FlushFn): FlushWriteStream;
  (opts: WriteStreamOptions, write: WriteFn, flush?: FlushFn): FlushWriteStream;
  new (write: WriteFn, flush?: FlushFn): FlushWriteStream;
  new (opts: WriteStreamOptions, write: WriteFn, flush?: FlushFn): FlushWriteStream;
  obj: {
    (write: WriteFn, flush?: FlushFn): FlushWriteStream;
    (opts: WriteStreamOptions | null, write: WriteFn, flush?: FlushFn): FlushWriteStream;
  };
}

// Signal buffer to trigger flush - use a unique buffer instance
const SIGNAL_FLUSH = bufferFrom([0]);

function WriteStream(this: FlushWriteStream, opts?: WriteStreamOptions | WriteFn, write?: WriteFn | FlushFn, flush?: FlushFn): FlushWriteStream {
  if (!(this instanceof WriteStream)) {
    // biome-ignore lint/suspicious/noExplicitAny: Allow calling without new
    return new (WriteStream as any)(opts, write, flush);
  }

  if (typeof opts === 'function') {
    flush = write as FlushFn;
    write = opts;
    opts = {};
  }

  Writable.call(this, opts || {});
  this.destroyed = false;
  this._worker = (write as WriteFn) || null;
  this._flush = flush || null;
  return this;
}

util.inherits(WriteStream, Writable);

// Static method for object mode streams
// biome-ignore lint/suspicious/noExplicitAny: Constructor pattern requires any
(WriteStream as any).obj = (opts?: WriteStreamOptions | WriteFn, worker?: WriteFn | FlushFn, flush?: FlushFn): FlushWriteStream => {
  if (typeof opts === 'function') {
    // biome-ignore lint/suspicious/noExplicitAny: Constructor pattern requires any
    return (WriteStream as any).obj(null, opts, worker);
  }
  if (!opts) opts = {};
  opts.objectMode = true;
  // biome-ignore lint/suspicious/noExplicitAny: Allow calling without new
  return new (WriteStream as any)(opts, worker, flush);
};

// biome-ignore lint/suspicious/noExplicitAny: Object mode allows any chunk type
WriteStream.prototype._write = function (data: any, enc: BufferEncoding, cb: WriteCallback): void {
  if (SIGNAL_FLUSH === data) {
    if (this._flush) this._flush(cb);
    else cb();
  } else if (this._worker) {
    this._worker(data, enc, cb);
  } else {
    cb();
  }
};

// biome-ignore lint/suspicious/noExplicitAny: Object mode allows any chunk type
WriteStream.prototype.end = function (data?: any, enc?: BufferEncoding | WriteCallback, cb?: WriteCallback): FlushWriteStream {
  if (!this._flush) {
    // Pass through to parent end() with all arguments
    if (typeof data === 'function') return Writable.prototype.end.call(this, data);
    if (typeof enc === 'function') return Writable.prototype.end.call(this, data, enc);
    return Writable.prototype.end.call(this, data, enc, cb);
  }
  if (typeof data === 'function') return this.end(null, null, data);
  if (typeof enc === 'function') return this.end(data, null, enc);
  if (data) this.write(data);
  if (!this._writableState.ending) this.write(SIGNAL_FLUSH);
  return Writable.prototype.end.call(this, cb);
};

WriteStream.prototype.destroy = function (err?: Error): FlushWriteStream {
  if (this.destroyed) return this;
  this.destroyed = true;
  if (err) this.emit('error', err);
  this.emit('close');
  return this;
};

export default WriteStream as unknown as WriteStreamConstructor;
