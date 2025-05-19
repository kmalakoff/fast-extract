import './polyfills.cjs';
import worker from './worker.js';

export { default as createWriteStream } from './createWriteStream.js';
export default function fastExtract(src, dest, options, callback) {
  if (options === undefined && typeof dest !== 'string') {
    callback = options;
    options = dest;
    dest = null;
  }

  if (typeof options === 'function') {
    callback = options;
    options = null;
  }
  options = options || {};

  if (typeof callback === 'function') return worker(src, dest, options, callback);
  return new Promise((resolve, reject) => worker(src, dest, options, (err, res) => (err ? reject(err) : resolve(res))));
}
