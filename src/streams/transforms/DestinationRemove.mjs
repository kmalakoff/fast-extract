import { Transform } from 'stream';
import util from 'util';
import rimraf2 from 'rimraf2';

function DestinationRemove(dest, options) {
  if (!(this instanceof DestinationRemove)) return new DestinationRemove(options);
  options = options ? { ...options, objectMode: true } : { objectMode: true };
  Transform.call(this, options);

  this.dest = dest;
}

util.inherits(DestinationRemove, Transform);

DestinationRemove.prototype._transform = function _transform(chunk, encoding, callback) {
  if (this.removed) return callback(null, chunk, encoding);
  rimraf2(this.dest, { disableGlob: true }, (err) => {
    this.removed = true;
    err && err.code !== 'EEXIST' ? callback(err) : callback(null, chunk, encoding);
  });
};

export default DestinationRemove;
