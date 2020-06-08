var createProcesor = require('maximize-iterator/lib/createProcessor');

var Fifo = require('./Fifo');

var drainStack = require('./drainStack');
var processOrQueue = require('./processOrQueue');

function BaseIterator() {
  if (!(this instanceof BaseIterator)) return new BaseIterator();
  var self = this;

  self.queued = new Fifo();
  self.processors = new Fifo();
  self.stack = new Fifo();
  self.entries = new Fifo();
  self.links = new Fifo();
}

BaseIterator.prototype.destroy = function destroy() {
  if (this.destroyed) throw new Error('Already destroyed');
  this.destroyed = true;

  if (!this.done) this.end();
  this.processors = null;
  this.queued = null;
  this.stack = null;
  this.entries = null;
};

BaseIterator.prototype.end = function end(err) {
  if (this.done) throw new Error('Already ended');
  drainStack(this);
  this.done = true;
  while (this.processors.length) this.processors.pop()(true);
  while (this.queued.length) err ? this.queued.pop()(err) : this.queued.pop()(null, null);
  while (this.stack.length) this.stack.pop();
  while (this.entries.length) this.entries.pop();
};

BaseIterator.prototype.resume = function resume() {
  drainStack(this);
};

BaseIterator.prototype.next = function next(callback) {
  if (typeof callback === 'function') return processOrQueue(this, callback);

  var self = this;
  return new Promise(function nextPromise(resolve, reject) {
    self.next(function nextCallback(err, result) {
      err ? reject(err) : resolve(result);
    });
  });
};

BaseIterator.prototype.forEach = function forEach(fn, options, callback) {
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

if (typeof Symbol !== 'undefined' && Symbol.asyncBaseIterator) {
  BaseIterator.prototype[Symbol.asyncBaseIterator] = function asyncBaseIterator() {
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

module.exports = BaseIterator;
