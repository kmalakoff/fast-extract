import fs from 'fs';
import mkdirp from 'mkdirp-classic';
import path from 'path';
import { Transform, type TransformCallback, type TransformOptions } from 'stream';
import tempSuffix from 'temp-suffix';

import type { OptionsInternal } from '../../types.js';

export default class WriteFileTransform extends Transform {
  private tempPath: string;
  private stream: NodeJS.WritableStream;

  constructor(dest: string, options?: OptionsInternal | TransformOptions<Transform>) {
    options = options ? { ...options, objectMode: true } : { objectMode: true };
    super(options);
    this.tempPath = tempSuffix(dest);
    (options as OptionsInternal)._tempPaths.push(this.tempPath);
  }

  _transform(chunk: unknown, encoding: BufferEncoding, callback: TransformCallback): undefined {
    if (this.stream) {
      this.stream.write(chunk as string, encoding, () => {
        callback();
      });
      return;
    }

    mkdirp(path.dirname(this.tempPath), (err) => {
      if (err) return callback(err);
      this.stream = fs.createWriteStream(this.tempPath, { flags: 'w' });
      this.stream.write(chunk as string, encoding, () => {
        callback();
      });
    });
  }

  _flush(callback: TransformCallback): undefined {
    if (!this.stream) {
      callback();
      return;
    }
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
