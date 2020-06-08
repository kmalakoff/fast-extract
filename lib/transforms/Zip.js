var Transform = require('stream').Transform || require('readable-stream').Transform;
var util = require('util');
var assign = require('object-assign');

var ZipIterator = require('../iterators/Zip');

function ZipTransform(options) {
  if (!(this instanceof ZipTransform)) return new ZipTransform(options);
  options = options ? assign({}, options, { objectMode: true }) : { objectMode: true };
  Transform.call(this, options);
}

util.inherits(ZipTransform, Transform);

ZipTransform.prototype._transform = function _transform(fullPath, encoding, callback) {
  if (typeof fullPath !== 'string') fullPath = fullPath.toString();

  var self = this;
  var iterator = new ZipIterator(fullPath);
  function next(err, entry) {
    if (err) return self.end(err);
    if (entry === null) {
      self.push(null);
      return callback();
    }
    self.push(entry);
    iterator.next(next);
  }
  iterator.next(next);
};

module.exports = ZipTransform;
