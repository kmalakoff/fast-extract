var path = require('path');
var fs = require('fs');
var Transform = require('stream').Transform;
var util = require('util');
var mkpath = require('mkpath');

var tempSuffix = require('temp-suffix');

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
    return this.stream.write(chunk, encoding, function () {
      callback();
    });

  var self = this;
  mkpath(path.dirname(this.tempPath), function (err) {
    if (err) return callback(err);
    self.stream = fs.createWriteStream(self.tempPath, { flags: 'w' });
    self.stream.write(chunk, encoding, function () {
      callback();
    });
  });
};

WriteFileTransform.prototype._flush = function _flush(callback) {
  if (!this.stream) return callback();

  var self = this;
  this.stream.end(function () {
    self.stream = null;
    self.push(self.tempPath);
    self.push(null);
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
