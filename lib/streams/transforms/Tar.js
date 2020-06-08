var Transform = require('stream').Transform || require('readable-stream').Transform;
var util = require('util');
var assign = require('object-assign');

var TarIterator = require('../../iterators/Tar');

function TarTransform(options) {
  if (!(this instanceof TarTransform)) return new TarTransform(options);
  options = options ? assign({}, options, { objectMode: true }) : { objectMode: true };
  Transform.call(this, options);
}

util.inherits(TarTransform, Transform);

TarTransform.prototype._transform = function _transform(chunk, encoding, callback) {
  if (this.iterator) return this.iterator.extract.write(chunk, encoding, callback);

  var self = this;
  self.iterator = new TarIterator();
  self.iterator.extract.write(chunk, encoding, callback);
  self.iterator.forEach(
    function (entry) {
      self.push(entry);
    },
    { concurrency: 1 },
    function (err) {
      self.push(null);
      self.end(err);
    }
  );
};

TarTransform.prototype._flush = function _flush(callback) {
  var self = this;
  this.iterator.extract.end(function (err) {
    self.iterator.destroy();
    self.iterator = null;
    callback(err);
  });
};

module.exports = TarTransform;
