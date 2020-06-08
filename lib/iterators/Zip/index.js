var yauzl = require('yauzl');
var util = require('util');

var BaseIterator = require('../Base');
var createEntry = require('./createEntry');

function ZipIterator(fullPath) {
  if (!(this instanceof ZipIterator)) return new ZipIterator(fullPath);
  BaseIterator.call(this);

  var self = this;
  yauzl.open(fullPath, { lazyEntries: true }, function (err, extract) {
    if (err) return extract.close(err);

    var next = extract.readEntry.bind(extract);
    extract.on('entry', function (header) {
      if (self.done) return extract.close();

      createEntry(header, extract, function (err, entry) {
        if (err || self.done) return extract.close(err);

        self.entries.push(entry);
        self.stack.push(next);
        self.resume();
      });
    });
    extract.on('error', self.end.bind(self));
    extract.on('close', self.end.bind(self));
    next();
  });
}

util.inherits(ZipIterator, BaseIterator);

module.exports = ZipIterator;
