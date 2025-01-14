import fs from 'fs';
import { Transform } from 'stream';

export default class DestinationNotExists extends Transform {
  constructor(dest, options) {
    options = options ? { ...options, objectMode: true } : { objectMode: true };
    super(options);
    this.dest = dest;
  }

  _transform(chunk, encoding, callback) {
    if (this.ready) return callback(null, chunk, encoding);
    fs.readdir(this.dest, (dirErr, names) => {
      this.ready = true;
      const err = !dirErr && names.length ? new Error(`Cannot overwrite ${this.dest} without force option`) : null;
      err ? callback(err) : callback(null, chunk, encoding);
    });
  }
}
