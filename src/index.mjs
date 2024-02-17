import extract from './extract.cjs';

export { default as createWriteStream } from './createWriteStream.cjs';
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
  if (typeof callback === 'function') return extract(src, dest, options || {}, callback);
  return new Promise((resolve, reject) => {
    fastExtract(src, dest, options, (err, res) => {
      err ? reject(err) : resolve(res);
    });
  });
}
