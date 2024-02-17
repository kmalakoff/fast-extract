require('./polyfills.js');
const once = require('once');
const eos = require('end-of-stream');

const createWriteStream = require('./createWriteStream.cjs');

module.exports = function extract(source, dest, options, callback) {
  if (typeof options === 'string') options = { type: options };
  options = Object.assign({ source: source }, options);
  const res = createWriteStream(dest, options);

  // path
  if (typeof source === 'string') {
    callback = once(callback);
    res.on('error', callback);
    res.write(source, 'utf8');
    return res.end(callback);
  }
  // stream

  return eos(source.pipe(res), callback);
};
