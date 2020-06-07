var Transform = require('stream').Transform || require('readable-stream').Transform;
var util = require('util');
var assign = require('object-assign');
var tarStream = require('tar-stream');

var createEntry = require('./createEntry');
var LinksEntry = require('../../entry/Links');

function TarTransform(options) {
  if (!(this instanceof TarTransform)) return new TarTransform(options);
  options = options ? assign({}, options, { objectMode: true }) : { objectMode: true };
  Transform.call(this, options);

  var self = this;
  var extract = tarStream.extract();
  var links = new LinksEntry();

  extract.on('entry', function (header, stream, callback) {
    createEntry(header, stream, function (err, entry) {
      if (err) return callback(err);

      if (entry.type === 'link' || entry.type === 'symlink') {
        links.push(entry);
        return callback();
      }
      self.push(entry);
      callback();
    });
  });

  extract.on('error', function (err) {
    self.end(err);
  });

  extract.on('finish', function () {
    self.push(links);
    self.push(null);
  });
  this.extract = extract;
}

util.inherits(TarTransform, Transform);

TarTransform.prototype._transform = function (chunk, encoding, callback) {
  this.extract.write(chunk, encoding, callback);
};

TarTransform.prototype._flush = function (callback) {
  this.extract.end(callback);
};

module.exports = TarTransform;
