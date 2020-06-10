require('./lib/patch');
var extract = require('./lib/extract');
var createWriteStream = require('./lib/createWriteStream');

function fastExtract(src, dest, options, callback) {
  if (arguments.length === 2 && typeof dest !== 'string') {
    callback = options;
    options = dest;
    dest = null;
  }

  if (typeof options === 'function') {
    callback = options;
    options = null;
  }
  if (typeof callback === 'function') return extract(src, dest, options || {}, callback);
  return new Promise(function (resolve, reject) {
    fastExtract(src, dest, options, function (err, res) {
      err ? reject(err) : resolve(res);
    });
  });
}

module.exports = fastExtract;
module.exports.createWriteStream = createWriteStream;
