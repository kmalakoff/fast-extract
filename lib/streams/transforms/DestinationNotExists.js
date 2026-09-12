var Transform = require('stream').Transform || require('readable-stream').Transform;
var fs = require('fs');
var util = require('util');
var assign = require('object-assign');

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
  fs.readdir(this.dest, function (err, names) {
    if (!err && names.length) return callback(new Error('Cannot overwrite ' + self.dest + ' without force option'));
    self.checked = true;
    callback(null, chunk, encoding);
  });
};

module.exports = DestinationNotExists;
