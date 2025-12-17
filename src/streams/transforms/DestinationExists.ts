import fs from 'fs';
import type { TransformCallback, TransformOptions, Transform as TransformT } from 'stream';
import { Transform } from '../../compat/stream.ts';

export default class DestinationExists extends Transform {
  private dest: string;
  private ready: boolean;

  constructor(dest: string, options: TransformOptions<TransformT> = {}) {
    options = options ? { ...options, objectMode: true } : { objectMode: true };
    super(options);
    this.dest = dest;
  }

  _transform(chunk: unknown, _encoding: BufferEncoding, callback: TransformCallback): undefined {
    if (this.ready) {
      callback(null, chunk);
      return;
    }
    fs.readdir(this.dest, (dirErr, names) => {
      this.ready = true;
      const err = !dirErr && names.length ? new Error(`Cannot overwrite ${this.dest} without force option`) : null;
      err ? callback(err) : callback(null, chunk);
    });
  }
}
