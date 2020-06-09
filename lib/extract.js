var path = require('path');
var once = require('once');
var eos = require('end-of-stream');
var assign = require('object-assign');

// var atomicCallbackFn = require('./safe/atomicCallbackFn');
var extname = require('./completeExtname');
var createWriteStream = require('./createWriteStream');

module.exports = function extract(src, dest, options, callback) {
  // callback = atomicCallbackFn(dest, callback);

  var basename = typeof src === 'string' ? path.basename(src) : src.basename || src.filename || '';
  options = assign({ basename: basename, path: typeof src === 'string', type: extname(basename) }, options);
  var res = createWriteStream(dest, options);

  if (typeof src === 'string') {
    callback = once(callback);
    res.on('error', callback);
    res.write(src, 'utf8');
    return res.end(callback);
  } else {
    src = src.pipe(res);
    res.on('error', callback);
    eos(src, function (err) {
      callback(err);
    });
  }
};
