import fs from 'fs';
import oo from 'on-one';
import type { TransformCallback, TransformOptions, Transform as TransformT } from 'stream';
import { Transform } from '../../compat/stream.ts';

import type { OptionsInternal } from '../../types.ts';

export default class PathToData extends Transform {
  constructor(options?: OptionsInternal | TransformOptions<TransformT>) {
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
