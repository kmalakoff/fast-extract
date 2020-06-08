var path = require('path');
var fs = require('fs');
var Transform = require('stream').Transform || require('readable-stream').Transform;
var util = require('util');
var assign = require('object-assign');
var mkpath = require('mkpath');

var tempSuffix = require('../tempSuffix');

var TMP_DIR = path.join(require('osenv').home(), '.tmp');

function WriteFileTransform(options) {
  if (!(this instanceof WriteFileTransform)) return new WriteFileTransform(options);
  options = options ? assign({}, options, { objectMode: true }) : { objectMode: true };
  Transform.call(this, options);

  this.tempPath = options.tempPath || path.join(TMP_DIR, tempSuffix('file.zip'));
}

util.inherits(WriteFileTransform, Transform);

WriteFileTransform.prototype._transform = function _transform(chunk, encoding, callback) {
  var self = this;
  var appendFile = fs.appendFile.bind(fs, this.tempPath, chunk, callback);
  if (self.pathMade) return appendFile();
  mkpath(path.dirname(self.tempPath), function () {
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
