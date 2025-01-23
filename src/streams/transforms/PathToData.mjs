import fs from 'fs';
import { Transform } from 'stream';
import oo from 'on-one';

export default class PathToData extends Transform {
  constructor(options) {
    super(options || {});
  }

  _transform(chunk, _encoding, callback) {
    const self = this;
    const fullPath = typeof chunk === 'string' ? chunk : chunk.toString();
    const stream = fs.createReadStream(fullPath);
    stream.on('data', function data(chunk) {
      self.push(chunk, 'buffer');
    });
    oo(stream, ['error', 'end', 'close', 'finish'], (err) => {
      !err || self.push(null);
      callback(err);
    });
  }
}
