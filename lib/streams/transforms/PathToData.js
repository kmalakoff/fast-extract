var fs = require('fs');
var Transform = require('stream').Transform || require('readable-stream').Transform;
var util = require('util');
var eos = require('end-of-stream');

function PathToData(options) {
  if (!(this instanceof PathToData)) return new PathToData(options);
  Transform.call(this, options || {});
}

util.inherits(PathToData, Transform);

PathToData.prototype._transform = function _transform(chunk, encoding, callback) {
  var self = this;
  var fullPath = typeof chunk === 'string' ? chunk : chunk.toString();
  var stream = fs.createReadStream(fullPath);
  stream.on('data', function data(chunk) {
    self.push(chunk, 'buffer');
  });
  eos(stream, function (err) {
    !err || self.push(null);
    callback(err);
  });
};

module.exports = PathToData;
