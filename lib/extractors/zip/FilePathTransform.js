var path = require('path');
var fs = require('fs');
var Transform = require('stream').Transform || require('readable-stream').Transform;
var util = require('util');
var assign = require('object-assign');
var mkpath = require('mkpath');

var tempFilename = require('../../tempFilename');

var TMP_DIR = path.join(require('osenv').home(), '.tmp');

function FilePathTransform(options) {
  if (!(this instanceof FilePathTransform)) return new FilePathTransform(options);
  options = options ? assign({}, options, { objectMode: true }) : { objectMode: true };
  Transform.call(this, options);

  this.tempPath = options.tempPath || path.join(TMP_DIR, tempFilename('file.zip'));
}

util.inherits(FilePathTransform, Transform);

FilePathTransform.prototype._transform = function (chunk, encoding, callback) {
  var self = this;

  mkpath(path.dirname(self.tempPath), function () {
    fs.appendFile(self.tempPath, chunk, callback);
  });
};

FilePathTransform.prototype._flush = function (callback) {
  this.push(this.tempPath);
  this.push(null);
  callback();
};

module.exports = FilePathTransform;
