var Transform = require('stream').Transform || require('readable-stream').Transform;
var util = require('util');
var assign = require('object-assign');
var access = require('fs-access-compat');

function DestinationNotExists(dest, options) {
  if (!(this instanceof DestinationNotExists)) return new DestinationNotExists(options);
  options = options ? assign({}, options, { objectMode: true }) : { objectMode: true };
  Transform.call(this, options);

  this.dest = dest;
}

util.inherits(DestinationNotExists, Transform);

DestinationNotExists.prototype._transform = function _transform(chunk, encoding, callback) {
  if (this.checked) return callback(null, chunk, encoding);

  var self = this;
  access(this.dest, function (err) {
    self.checked = true;
    if (!err) return callback(new Error('Cannot overwrite ' + self.dest + ' without force option'));
    callback(null, chunk, encoding);
  });
};

module.exports = DestinationNotExists;
