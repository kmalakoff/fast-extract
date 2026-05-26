import { Transform } from 'extract-base-iterator';
import throttle from 'lodash.throttle';
import type { TransformCallback, TransformOptions, Transform as TransformT } from 'stream';

import type { OptionsInternal, Progress } from '../../types.ts';

type ProgressFn = (entry: Progress | null) => boolean | undefined;

export default class EntryProgressTransform extends Transform {
  private progress: ProgressFn | null = null;

  constructor(options: OptionsInternal | TransformOptions<TransformT>) {
    options = options ? { ...options, objectMode: true } : { objectMode: true };
    super(options);
    const internalOptions = options as OptionsInternal;

    let done = false;
    const progressFn: ProgressFn = function progressFn(entry: Progress | null): boolean | undefined {
      if (done) return; // throttle can call after done
      if (!entry) {
        done = true;
        return done;
      }
      if (internalOptions.progress) internalOptions.progress({ ...entry, progress: 'extract' });
      return undefined;
    };
    const time = internalOptions.time;
    this.progress = time !== undefined ? (throttle(progressFn as unknown as (...args: unknown[]) => unknown, time, { leading: true }) as unknown as ProgressFn) : progressFn;
  }

  _transform(entry: Progress, encoding: BufferEncoding, callback: TransformCallback): void {
    if (this.progress) this.progress(entry);
    this.push(entry, encoding);
    callback();
  }

  _flush(callback: TransformCallback): void {
    if (this.progress) {
      const p = this.progress;
      this.progress = null;
      p(null);
      const throttled = p as unknown as { cancel?: () => void };
      if (throttled.cancel) throttled.cancel();
    }
    callback();
  }
}
