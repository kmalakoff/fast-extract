import fs from 'fs';
import { Transform, type TransformCallback, type TransformOptions } from 'stream';
import oo from 'on-one';

import type { OptionsInternal } from '../../types.js';

export default class PathToData extends Transform {
  constructor(options?: OptionsInternal | TransformOptions<Transform>) {
    options = options ? { ...options, objectMode: true } : { objectMode: true };
    super(options);
  }

  _transform(chunk: unknown, _encoding: BufferEncoding, callback: TransformCallback): undefined {
    const fullPath = typeof chunk === 'string' ? chunk : chunk.toString();
    const stream = fs.createReadStream(fullPath);
    stream.on('data', (chunk) => {
      this.push(chunk);
    });
    oo(stream, ['error', 'end', 'close', 'finish'], (err?: Error) => {
      !err || this.push(null);
      callback(err);
    });
  }
}
