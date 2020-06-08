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
  self.iterator = new ZipIterator(fullPath);
  self.iterator.forEach(
    function (entry) {
      self.push(entry);
    },
    { concurrency: 1 },
    function (err) {
      // self.iterator.destroy();
      self.iterator = null;
      err ? self.end(err) : self.push(null);
      callback(err);
    }
  );
};

module.exports = ZipTransform;
