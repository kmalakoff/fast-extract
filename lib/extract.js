var once = require('once');
var eos = require('end-of-stream');
var assign = require('object-assign');

var createWriteStream = require('./createWriteStream');

module.exports = function extract(source, dest, options, callback) {
  if (typeof options === 'string') options = { type: options };
  options = assign({ source: source }, options);
  var res = createWriteStream(dest, options);

  // path
  if (typeof source === 'string') {
    callback = once(callback);
    res.on('error', callback);
    res.write(source, 'utf8');
    return res.end(callback);
  }
  // stream
  else {
    return eos(source.pipe(res), callback);
  }
};
