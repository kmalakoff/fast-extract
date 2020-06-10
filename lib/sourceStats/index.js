var getBasename = require('./basename');
var getSize = require('./size');

module.exports = function sourceStats(source, options, endpoint, callback) {
  if (typeof endpoint === 'function') {
    callback = endpoint;
    endpoint = null;
  }

  getSize(source, options, function (err, size) {
    if (err) return callback(err);
    var stats = {};
    var basename = getBasename(source, options, endpoint);
    if (basename !== undefined) stats.basename = basename;
    if (size !== undefined) stats.size = size;
    callback(null, stats);
  });
};
