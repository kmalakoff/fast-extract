import fs from 'fs';
import { Transform } from 'stream';
import once from 'call-once-fn';

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
    const end = once((err) => {
      !err || self.push(null);
      callback(err);
    });
    stream.on('error', end);
    stream.on('end', end);
    stream.on('close', end);
    stream.on('finish', end);
  }
}
