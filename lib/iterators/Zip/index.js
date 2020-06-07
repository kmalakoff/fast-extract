var yauzl = require('yauzl');
var createProcesor = require('maximize-iterator/lib/createProcessor');

var Fifo = require('../../Fifo');

var createEntry = require('./createEntry');
var drainStack = require('../Base/drainStack');
var processOrQueue = require('../Base/processOrQueue');

function ZipIterator(fullPath) {
  if (!(this instanceof ZipIterator)) return new ZipIterator(fullPath);
  var self = this;

  self.queued = new Fifo();
  self.processors = new Fifo();
  self.stack = new Fifo();
  self.entries = new Fifo();
  self.links = new Fifo();

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

ZipIterator.prototype.destroy = function destroy() {
  if (this.destroyed) throw new Error('Already destroyed');
  this.destroyed = true;

  this.done = true;
  while (this.processors.length) this.processors.pop()(true);
  this.processors = null;
  while (this.queued.length) this.queued.pop()(null, null);
  this.queued = null;
  while (this.stack.length) this.stack.pop();
  this.stack = null;
  while (this.entries.length) this.entries.pop();
  this.entries = null;
};

ZipIterator.prototype.next = function next(callback) {
  if (typeof callback === 'function') return processOrQueue(this, callback);

  var self = this;
  return new Promise(function nextPromise(resolve, reject) {
    self.next(function nextCallback(err, result) {
      err ? reject(err) : resolve(result);
    });
  });
};

ZipIterator.prototype.forEach = function forEach(fn, options, callback) {
  var self = this;
  if (typeof fn !== 'function') throw new Error('Missing each function');
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  if (typeof callback === 'function') {
    if (this.done) return callback(null, true);
    options = options || {};
    options = {
      each: fn,
      callbacks: options.callbacks || false,
      concurrency: options.concurrency || Infinity,
      limit: options.limit || Infinity,
      total: 0,
      counter: 0,
      stop: function stop() {
        return self.done || self.queued.length >= self.stack.length;
      },
    };

    var processor = createProcesor(this.next.bind(this), options, function processorCallback(err) {
      if (!self.destroyed) self.processors.remove(self.processors.find(processor));
      processor = null;
      options = null;
      return callback(err, self.done ? true : !self.stack.length);
    });
    this.processors.push(processor);
    processor();
    return;
  }

  return new Promise(function forEachPromise(resolve, reject) {
    self.forEach(fn, options, function forEachCallback(err, done) {
      err ? reject(err) : resolve(done);
    });
  });
};

if (typeof Symbol !== 'undefined' && Symbol.asyncZipIterator) {
  ZipIterator.prototype[Symbol.asyncZipIterator] = function asyncZipIterator() {
    var self = this;
    return {
      next: function next() {
        return self.next().then(function nextCallback(value) {
          return Promise.resolve({ value: value, done: value === null });
        });
      },
      destroy: function destroy() {
        self.destroy();
        return Promise.resolve();
      },
    };
  };
}

module.exports = ZipIterator;
