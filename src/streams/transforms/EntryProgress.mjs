import { Transform } from 'stream';
import util from 'util';
import throttle from 'lodash.throttle';

function EntryProgressTransform(options) {
  if (!(this instanceof EntryProgressTransform)) return new EntryProgressTransform();
  Transform.call(this, { objectMode: true });
  let done = false;
  this.progress = function progress(entry) {
    if (done) return; // throttle can call after done
    // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
    if (!entry) return (done = true);
    options.progress(Object.assign({ progress: 'extract' }, entry));
  };
  if (options.time) this.progress = throttle(this.progress, options.time, { leading: true });
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

export default EntryProgressTransform;
