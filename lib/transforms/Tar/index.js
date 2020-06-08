var Transform = require('stream').Transform || require('readable-stream').Transform;
var util = require('util');
var assign = require('object-assign');

var TarIterator = require('../../iterators/Tar');

function TarTransform(options) {
  if (!(this instanceof TarTransform)) return new TarTransform(options);
  options = options ? assign({}, options, { objectMode: true }) : { objectMode: true };
  Transform.call(this, options);

  var self = this;
  self.iterator = new TarIterator();
  function next(err, entry) {
    if (err) return self.end(err);
    if (entry === null) return self.push(null);
    self.push(entry);
    self.iterator.next(next);
  }
  self.iterator.next(next);
}

util.inherits(TarTransform, Transform);

TarTransform.prototype._transform = function (chunk, encoding, callback) {
  this.iterator.extract.write(chunk, encoding, callback);
};

TarTransform.prototype._flush = function (callback) {
  var self = this;
  this.iterator.extract.end(function (err) {
    self.iterator.destroy();
    self.iterator = null;
    callback(err);
  });
};

module.exports = TarTransform;
