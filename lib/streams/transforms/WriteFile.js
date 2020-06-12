var path = require('path');
var fs = require('graceful-fs');
var Transform = require('stream').Transform || require('readable-stream').Transform;
var util = require('util');
var assign = require('object-assign');
var mkpath = require('mkpath');

var tempSuffix = require('temp-suffix');

function WriteFileTransform(dest, options) {
  if (!(this instanceof WriteFileTransform)) return new WriteFileTransform(options);
  options = options ? assign({}, options, { objectMode: true }) : { objectMode: true };
  Transform.call(this, options);

  this.tempPath = tempSuffix(dest);
  options._tempPaths.push(this.tempPath);
}

util.inherits(WriteFileTransform, Transform);

WriteFileTransform.prototype._transform = function _transform(chunk, encoding, callback) {
  var self = this;
  var appendFile = fs.appendFile.bind(fs, this.tempPath, chunk, callback);
  if (this.pathMade) return appendFile();
  mkpath(path.dirname(this.tempPath), function () {
    self.pathMade = true;
    appendFile();
  });
};

WriteFileTransform.prototype._flush = function _flush(callback) {
  this.push(this.tempPath);
  this.push(null);
  callback();
};

module.exports = WriteFileTransform;
