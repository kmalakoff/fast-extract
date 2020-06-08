var Transform = require('stream').Transform || require('readable-stream').Transform;
var util = require('util');
var mkpath = require('mkpath');

function MakeDirectoryTransform(fullPath) {
  if (!(this instanceof MakeDirectoryTransform)) return new MakeDirectoryTransform(fullPath);
  Transform.call(this, {});
  this.fullPath = fullPath;
}

util.inherits(MakeDirectoryTransform, Transform);

MakeDirectoryTransform.prototype._transform = function _transform(chunk, encoding, callback) {
  var self = this;

  function passThrough() {
    if (self.created) {
      self.push(chunk, encoding);
      return callback();
    }
    mkpath(self.fullPath, function () {
      self.created = true;
      passThrough();
    });
  }
  passThrough();
};

module.exports = MakeDirectoryTransform;
