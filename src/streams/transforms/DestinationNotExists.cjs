const Transform = require('stream').Transform;
const fs = require('fs');
const util = require('util');

function DestinationNotExists(dest, options) {
  if (!(this instanceof DestinationNotExists)) return new DestinationNotExists(options);
  options = options ? Object.assign({}, options, { objectMode: true }) : { objectMode: true };
  Transform.call(this, options);

  this.dest = dest;
}

util.inherits(DestinationNotExists, Transform);

DestinationNotExists.prototype._transform = function _transform(chunk, encoding, callback) {
  if (this.ready) return callback(null, chunk, encoding);
  fs.readdir(this.dest, (dirErr, names) => {
    this.ready = true;
    const err = !dirErr && names.length ? new Error(`Cannot overwrite ${this.dest} without force option`) : null;
    err ? callback(err) : callback(null, chunk, encoding);
  });
};

module.exports = DestinationNotExists;
