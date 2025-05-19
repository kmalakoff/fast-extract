import { Transform } from 'stream';
import throttle from 'lodash.throttle';

export default class EntryProgressTransform extends Transform {
  private progress: (entry: object) => boolean;

  constructor(options) {
    super({ objectMode: true });
    let done = false;
    this.progress = function progress(entry: object) {
      if (done) return; // throttle can call after done
      // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
      if (!entry) return (done = true);
      options.progress({ progress: 'extract', ...entry });
    };
    if (options.time) this.progress = throttle(this.progress, options.time, { leading: true });
  }

  _transform(entry, encoding, callback) {
    this.progress(entry);
    this.push(entry, encoding);
    callback();
  }

  _flush(callback) {
    this.progress(null);
    callback();
  }
}
