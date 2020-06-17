var Transform = require('stream').Transform || require('readable-stream').Transform;
var util = require('util');
var assign = require('object-assign');

var ZipIterator = require('zip-iterator');

function ZipTransform(options) {
  if (!(this instanceof ZipTransform)) return new ZipTransform(options);
  options = options ? assign({}, options, { objectMode: true }) : { objectMode: true };
  Transform.call(this, options);
}

util.inherits(ZipTransform, Transform);

ZipTransform.prototype._transform = function _transform(chunk, encoding, callback) {
  var fullPath = typeof chunk === 'string' ? chunk : chunk.toString();

  var self = this;
  var iterator = new ZipIterator(fullPath);
  iterator.forEach(
    function (entry) {
      self.push(entry);
    },
    { concurrency: 1 },
    function (err) {
      err || self.push(null);
      iterator.destroy();
      iterator = null;
      callback(err);
    }
  );
};

module.exports = ZipTransform;
