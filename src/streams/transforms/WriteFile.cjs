const path = require('path');
const fs = require('fs');
const Transform = require('stream').Transform;
const util = require('util');
const mkpath = require('mkpath');

const tempSuffix = require('temp-suffix');

function WriteFileTransform(dest, options) {
  if (!(this instanceof WriteFileTransform)) return new WriteFileTransform(options);
  options = Object.assign({ objectMode: true }, options || {});
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
  mkpath(path.dirname(this.tempPath), (err) => {
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

module.exports = WriteFileTransform;
