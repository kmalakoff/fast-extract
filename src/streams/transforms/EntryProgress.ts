import { Transform } from 'extract-base-iterator';
import throttle from 'lodash.throttle';
import type { TransformCallback, TransformOptions, Transform as TransformT } from 'stream';

import type { OptionsInternal, Progress } from '../../types.ts';

export default class EntryProgressTransform extends Transform {
  private progress: (entry: Progress) => boolean;

  constructor(options: OptionsInternal | TransformOptions<TransformT>) {
    options = options ? { ...options, objectMode: true } : { objectMode: true };
    super(options);
    const internalOptions = options as OptionsInternal;

    let done = false;
    this.progress = function progress(entry: Progress) {
      if (done) return; // throttle can call after done
      if (!entry) {
        done = true;
        return done;
      }
      internalOptions.progress({ progress: 'extract', ...entry });
    };
    const time = internalOptions.time;
    if (time !== undefined) this.progress = throttle(this.progress, time, { leading: true });
  }

  _transform(entry: Progress, encoding: BufferEncoding, callback: TransformCallback): void {
    if (this.progress) this.progress(entry);
    this.push(entry, encoding);
    callback();
  }

  _flush(callback: TransformCallback): void {
    if (this.progress) {
      this.progress(null);
      if ((this.progress as typeof throttle).cancel) (this.progress as typeof throttle).cancel();
      this.progress = null;
    }
    callback();
  }
}
