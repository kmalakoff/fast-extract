var Transform = require('stream').Transform;
var util = require('util');
var rimraf = require('rimraf');

function DestinationRemove(dest, options) {
  if (!(this instanceof DestinationRemove)) return new DestinationRemove(options);
  options = options ? Object.assign({}, options, { objectMode: true }) : { objectMode: true };
  Transform.call(this, options);

  this.dest = dest;
}

util.inherits(DestinationRemove, Transform);

DestinationRemove.prototype._transform = function _transform(chunk, encoding, callback) {
  if (this.removed) return callback(null, chunk, encoding);

  var self = this;
  rimraf(this.dest, function (err) {
    self.removed = true;
    err && err.code !== 'EEXIST' ? callback(err) : callback(null, chunk, encoding);
  });
};

module.exports = DestinationRemove;
