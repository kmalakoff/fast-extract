import throttle from 'lodash.throttle';

import { Transform, type TransformCallback, type TransformOptions } from 'stream';

import type { OptionsInternal, Progress } from '../../types.js';

export default class EntryProgressTransform extends Transform {
  private progress: (entry: Progress) => boolean;

  constructor(options: OptionsInternal | TransformOptions<Transform>) {
    options = options ? { ...options, objectMode: true } : { objectMode: true };
    super(options);
    let done = false;
    this.progress = function progress(entry: Progress) {
      if (done) return; // throttle can call after done
      // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
      if (!entry) return (done = true);
      (options as OptionsInternal).progress({ progress: 'extract', ...entry });
    };
    const time = (options as OptionsInternal).time;
    if (time !== undefined) this.progress = throttle(this.progress, time, { leading: true });
  }

  _transform(entry: Progress, encoding: BufferEncoding, callback: TransformCallback): undefined {
    this.progress(entry);
    this.push(entry, encoding);
    callback();
  }

  _flush(callback: TransformCallback): undefined {
    this.progress(null);
    callback();
  }
}
