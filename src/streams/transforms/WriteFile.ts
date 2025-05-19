import fs from 'fs';
import path from 'path';
import { Transform } from 'stream';
import mkdirp from 'mkdirp-classic';
import tempSuffix from 'temp-suffix';

import type { WriteOptions } from '../../types.js';

export default class WriteFileTransform extends Transform {
  private tempPath: string;
  private stream: NodeJS.WritableStream;

  constructor(dest: string, options) {
    options = options ? { ...options, objectMode: true } : { objectMode: true };
    super(options);
    this.tempPath = tempSuffix(dest);
    (options as WriteOptions)._tempPaths.push(this.tempPath);
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

  destroy(_error?: Error): this {
    if (this.stream) {
      this.stream.end();
      this.stream = null;
    }

    return this;
  }
}
