import fs from 'fs';
import path from 'path';
import { Transform } from 'stream';
import util from 'util';
import mkdirp from 'mkdirp-classic';

import tempSuffix from 'temp-suffix';

function WriteFileTransform(dest, options) {
  if (!(this instanceof WriteFileTransform)) return new WriteFileTransform(options);
  options = options ? { ...options, objectMode: true } : { objectMode: true };
  Transform.call(this, options);

  this.tempPath = tempSuffix(dest);
  options._tempPaths.push(this.tempPath);
}

util.inherits(WriteFileTransform, Transform);

WriteFileTransform.prototype._transform = function _transform(chunk, encoding, callback) {
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
};

WriteFileTransform.prototype._flush = function _flush(callback) {
  if (!this.stream) return callback();
  this.stream.end(() => {
    this.stream = null;
    this.push(this.tempPath);
    this.push(null);
    callback();
  });
};

WriteFileTransform.prototype.destroy = function destroy(err) {
  if (this.stream) {
    this.stream.end(err);
    this.stream = null;
  }
};

export default WriteFileTransform;
