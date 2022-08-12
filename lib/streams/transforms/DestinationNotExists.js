var Transform = require('stream').Transform;
var fs = require('fs');
var util = require('util');

function DestinationNotExists(dest, options) {
  if (!(this instanceof DestinationNotExists)) return new DestinationNotExists(options);
  options = options ? Object.assign({}, options, { objectMode: true }) : { objectMode: true };
  Transform.call(this, options);

  this.dest = dest;
}

util.inherits(DestinationNotExists, Transform);

DestinationNotExists.prototype._transform = function _transform(chunk, encoding, callback) {
  if (this.ready) return callback(null, chunk, encoding);

  var self = this;
  fs.readdir(this.dest, function (dirErr, names) {
    self.ready = true;
    var err = !dirErr && names.length ? new Error('Cannot overwrite ' + self.dest + ' without force option') : null;
    err ? callback(err) : callback(null, chunk, encoding);
  });
};

module.exports = DestinationNotExists;
