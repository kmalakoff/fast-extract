var Transform = require('stream').Transform || require('readable-stream').Transform;
var util = require('util');
var assign = require('object-assign');
var rimraf = require('rimraf');

function DestinationRemove(dest, options) {
  if (!(this instanceof DestinationRemove)) return new DestinationRemove(options);
  options = options ? assign({}, options, { objectMode: true }) : { objectMode: true };
  Transform.call(this, options);

  this.dest = dest;
}

util.inherits(DestinationRemove, Transform);

DestinationRemove.prototype._transform = function _transform(chunk, encoding, callback) {
  if (this.removed) return callback(null, chunk, encoding);

  var self = this;
  rimraf(this.dest, function (err) {
    self.removed = true;
    if (err && err.code !== 'EEXIST') return callback(err);
    callback(null, chunk, encoding);
  });
};

module.exports = DestinationRemove;
