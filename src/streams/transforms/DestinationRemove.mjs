import { Transform } from 'stream';
import rimraf2 from 'rimraf2';

export default class DestinationRemove extends Transform {
  constructor(dest, options) {
    options = options ? { ...options, objectMode: true } : { objectMode: true };
    super(options);
    this.dest = dest;
  }

  _transform(chunk, encoding, callback) {
    if (this.removed) return callback(null, chunk, encoding);
    rimraf2(this.dest, { disableGlob: true }, (err) => {
      this.removed = true;
      err && err.code !== 'EEXIST' ? callback(err) : callback(null, chunk, encoding);
    });
  }
}
