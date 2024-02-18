import { Transform } from 'stream';
import util from 'util';
import rimraf from 'rimraf';

function DestinationRemove(dest, options) {
  if (!(this instanceof DestinationRemove)) return new DestinationRemove(options);
  options = options ? Object.assign({}, options, { objectMode: true }) : { objectMode: true };
  Transform.call(this, options);

  this.dest = dest;
}

util.inherits(DestinationRemove, Transform);

DestinationRemove.prototype._transform = function _transform(chunk, encoding, callback) {
  if (this.removed) return callback(null, chunk, encoding);
  rimraf(this.dest, (err) => {
    this.removed = true;
    err && err.code !== 'EEXIST' ? callback(err) : callback(null, chunk, encoding);
  });
};

export default DestinationRemove;
