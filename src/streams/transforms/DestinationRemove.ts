import rimraf2 from 'rimraf2';
import type { TransformCallback, TransformOptions, Transform as TransformT } from 'stream';
import { Transform } from '../../compat/stream.ts';

export default class DestinationRemove extends Transform {
  private dest: string;
  private removed: boolean;

  constructor(dest: string, options: TransformOptions<TransformT> = {}) {
    options = options ? { ...options, objectMode: true } : { objectMode: true };
    super(options);
    this.dest = dest;
  }

  _transform(chunk: unknown, _encoding: BufferEncoding, callback: TransformCallback): undefined {
    if (this.removed) {
      callback(null, chunk);
      return;
    }
    rimraf2(this.dest, { disableGlob: true }, (err) => {
      this.removed = true;
      err && err.code !== 'EEXIST' ? callback(err) : callback(null, chunk);
    });
  }
}
