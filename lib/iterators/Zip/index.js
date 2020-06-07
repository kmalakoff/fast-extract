var yauzl = require('yauzl');
var util = require('util');

var BaseIterator = require('../Base');
var createEntry = require('./createEntry');
var drainStack = require('../Base/drainStack');

function ZipIterator(fullPath) {
  if (!(this instanceof ZipIterator)) return new ZipIterator(fullPath);
  BaseIterator.call(this);

  var self = this;
  yauzl.open(fullPath, { lazyEntries: true }, function (err, extract) {
    if (err) return extract.close(err);

    function callback(err) {
      if (err) {
        return extract.close(err);
      }
      extract.readEntry();
    }

    extract.on('entry', function (header) {
      if (self.done) return extract.close();

      createEntry(header, extract, function (err, entry) {
        if (err || self.done) return extract.close(err);

        if (entry.type === 'link' || entry.type === 'symlink') {
          self.links.unshift(entry);
          callback();
        } else {
          self.entries.push(entry);
          self.stack.push(callback);
          drainStack(self);
        }
      });
    });

    function onError(err) {
      self.entries.clear();
      self.entries.push({ error: err });
      drainStack(self);
      if (self.entries.length) return;
      self.done = true;
      while (self.processors.length) self.processors.pop()(true);
      while (self.queued.length) self.queued.pop()(null, null);
    }

    function onFinish() {
      if (self.done) return;
      while (self.links.length) self.entries.push(self.links.pop());
      drainStack(self);
      if (self.entries.length) return;
      self.done = true;
      while (self.processors.length) self.processors.pop()(true);
      while (self.queued.length) self.queued.pop()(null, null);
    }

    extract.on('error', onError);
    extract.on('close', onFinish);
    extract.readEntry();
  });
}

util.inherits(ZipIterator, BaseIterator);

module.exports = ZipIterator;
