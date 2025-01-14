import fs from 'fs';
import path from 'path';
import { Transform } from 'stream';
import mkdirp from 'mkdirp-classic';
import tempSuffix from 'temp-suffix';

export default class WriteFileTransform extends Transform {
  constructor(dest, options) {
    options = options ? { ...options, objectMode: true } : { objectMode: true };
    super(options);
    this.tempPath = tempSuffix(dest);
    options._tempPaths.push(this.tempPath);
  }

  _transform(chunk, encoding, callback) {
    if (this.stream)
      return this.stream.write(chunk, encoding, () => {
        callback();
      });
    mkdirp(path.dirname(this.tempPath), (err) => {
      if (err) return callback(err);
      this.stream = fs.createWriteStream(this.tempPath, { flags: 'w' });
      this.stream.write(chunk, encoding, () => {
        callback();
      });
    });
  }

  _flush(callback) {
    if (!this.stream) return callback();
    this.stream.end(() => {
      this.stream = null;
      this.push(this.tempPath);
      this.push(null);
      callback();
    });
  }

  destroy(err) {
    if (this.stream) {
      this.stream.end(err);
      this.stream = null;
    }
  }
}
