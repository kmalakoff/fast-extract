var tarStream = require('tar-stream');
var createProcesor = require('maximize-iterator/lib/createProcessor');
var eos = require('end-of-stream');

var Fifo = require('../../Fifo');

var createEntry = require('./createEntry');
var drainStack = require('../Base/drainStack');
var processOrQueue = require('../Base/processOrQueue');

function TarIterator(stream) {
  if (!(this instanceof TarIterator)) return new TarIterator(stream);
  var self = this;
  var extract = tarStream.extract();

  self.extract = extract;
  self.queued = new Fifo();
  self.processors = new Fifo();
  self.stack = new Fifo();
  self.entries = new Fifo();
  self.links = new Fifo();

  extract.on('entry', function (header, stream, callback) {
    if (self.done) return extract.close();

    createEntry(header, stream, function (err, entry) {
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

  if (stream) {
    eos(stream.pipe(extract), function (err) {
      err ? onError(err) : onFinish();
    });
  } else {
    extract.on('error', onError);
    extract.on('finish', onFinish);
  }
}

TarIterator.prototype.destroy = function destroy() {
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

TarIterator.prototype.write = function write(chunk, encoding, callback) {
  this.extract.write(chunk, encoding, callback);
};

TarIterator.prototype.end = function end(callback) {
  this.extract.end(callback);
};

TarIterator.prototype.next = function next(callback) {
  if (typeof callback === 'function') return processOrQueue(this, callback);

  var self = this;
  return new Promise(function nextPromise(resolve, reject) {
    self.next(function nextCallback(err, result) {
      err ? reject(err) : resolve(result);
    });
  });
};

TarIterator.prototype.forEach = function forEach(fn, options, callback) {
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

if (typeof Symbol !== 'undefined' && Symbol.asyncTarIterator) {
  TarIterator.prototype[Symbol.asyncTarIterator] = function asyncTarIterator() {
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

module.exports = TarIterator;
