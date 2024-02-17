const fs = require('fs');
const Transform = require('stream').Transform;
const util = require('util');
const eos = require('end-of-stream');

function PathToData(options) {
  if (!(this instanceof PathToData)) return new PathToData(options);
  Transform.call(this, options || {});
}

util.inherits(PathToData, Transform);

PathToData.prototype._transform = function _transform(chunk, _encoding, callback) {
  const self = this;
  const fullPath = typeof chunk === 'string' ? chunk : chunk.toString();
  const stream = fs.createReadStream(fullPath);
  stream.on('data', function data(chunk) {
    self.push(chunk, 'buffer');
  });
  eos(stream, (err) => {
    !err || self.push(null);
    callback(err);
  });
};

module.exports = PathToData;
