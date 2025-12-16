import fs from 'fs';
import oo from 'on-one';
import type { TransformCallback, TransformOptions, Transform as TransformT } from 'stream';
import { Transform } from '../../compat/stream.ts';

import type { OptionsInternal } from '../../types.ts';

export default class PathToData extends Transform {
  // Marker to identify this stream type - it ends itself via push(null)
  readonly _selfEnding = true;
  private _activeRead = false;
  private _flushCallback: TransformCallback | null = null;

  constructor(options?: OptionsInternal | TransformOptions<TransformT>) {
    options = options ? { ...options, objectMode: true } : { objectMode: true };
    super(options);
  }

  _transform(chunk: unknown, _encoding: BufferEncoding, callback: TransformCallback): undefined {
    const fullPath = typeof chunk === 'string' ? chunk : chunk.toString();
    const stream = fs.createReadStream(fullPath);
    this._activeRead = true;

    stream.on('data', (data) => {
      this.push(data);
    });
    // Call callback early to unblock upstream writes (e.g., for SIGNAL_FLUSH)
    // The transform will continue pushing data and signal completion via push(null)
    oo(stream, ['error'], (err?: Error) => {
      this._activeRead = false;
      // Use destroy if available (Node 8+), otherwise emit error directly
      if (typeof this.destroy === 'function') {
        this.destroy(err);
      } else {
        this.emit('error', err);
      }
    });
    oo(stream, ['end', 'close'], () => {
      this._activeRead = false;
      this.push(null);
      // If flush was waiting for read to complete, call it now
      if (this._flushCallback) {
        const cb = this._flushCallback;
        this._flushCallback = null;
        cb();
      }
    });
    callback();
  }

  _flush(callback: TransformCallback): undefined {
    // Wait for any active file read to complete before flushing
    if (this._activeRead) {
      this._flushCallback = callback;
    } else {
      callback();
    }
  }
}
