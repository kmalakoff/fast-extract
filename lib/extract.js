var once = require('once');
var eos = require('end-of-stream');
var assign = require('object-assign');

var extname = require('./extname');
var sourceStats = require('./sourceStats');
var createWriteStream = require('./createWriteStream');

module.exports = function extract(src, dest, options, callback) {
  var stats = sourceStats(src, options);
  options = assign(stats, { path: typeof src === 'string', type: extname(stats.basename || '') }, options);
  var res = createWriteStream(dest, options);

  // path
  if (typeof src === 'string') {
    callback = once(callback);
    res.on('error', callback);
    res.write(src, 'utf8');
    return res.end(callback);
  }
  // stream
  else {
    return eos(src.pipe(res), callback);
  }
};
