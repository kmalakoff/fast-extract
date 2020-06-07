var path = require('path');
var fs = require('fs');
var Transform = require('stream').Transform || require('readable-stream').Transform;
var util = require('util');
var assign = require('object-assign');
var yauzl = require('yauzl');
var mkpath = require('mkpath');

var createEntry = require('./createEntry');
var LinksEntry = require('../../entry/Links');
var tempFilename = require('../../tempFilename');

var TMP_DIR = path.join(require('osenv').home(), '.tmp');

function ZipTransform(options) {
  if (!(this instanceof ZipTransform)) return new ZipTransform(options);
  options = options ? assign({}, options, { objectMode: true }) : { objectMode: true };
  Transform.call(this, options);

  this.tempPath = options.tempPath || path.join(TMP_DIR, tempFilename('file.zip'));
}

util.inherits(ZipTransform, Transform);

ZipTransform.prototype._transform = function (chunk, encoding, callback) {
  var self = this;

  mkpath(path.dirname(self.tempPath), function () {
    fs.appendFile(self.tempPath, chunk, callback);
  });
};

ZipTransform.prototype._flush = function (callback) {
  var self = this;

  yauzl.open(self.tempPath, { lazyEntries: true }, function (err, extract) {
    if (err) return callback(err);

    var links = new LinksEntry();

    extract.on('entry', function (header) {
      function callback(err) {
        if (err) {
          extract.emit('error', err);
          return extract.close();
        }
        extract.readEntry();
      }

      createEntry(header, extract, function (err, entry) {
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
      callback(err);
    });

    extract.on('close', function () {
      self.push(links);
      self.push(null);
      callback();
    });
    extract.readEntry();
  });
};

module.exports = ZipTransform;
