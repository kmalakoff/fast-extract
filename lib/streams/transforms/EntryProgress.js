var Transform = require('stream').Transform || require('readable-stream').Transform;
var util = require('util');
var throttle = require('lodash.throttle');
var assign = require('object-assign');

function EntryProgressTransform(options) {
  if (!(this instanceof EntryProgressTransform)) return new EntryProgressTransform();
  Transform.call(this, { objectMode: true });

  var self = this;
  var done = false;
  self.progress = function progress(entry) {
    if (done) return; // throttle can call after done
    if (!entry) return (done = true);
    options.progress(assign({ progress: 'extract' }, entry));
  };
  if (options.time) self.progress = throttle(self.progress, options.time, { leading: true });
}

util.inherits(EntryProgressTransform, Transform);

EntryProgressTransform.prototype._transform = function _transform(entry, encoding, callback) {
  this.progress(entry);
  this.push(entry, encoding);
  callback();
};

EntryProgressTransform.prototype._flush = function _flush(callback) {
  this.progress(null);
  callback();
};

module.exports = EntryProgressTransform;
