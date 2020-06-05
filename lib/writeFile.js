var path = require('path');
var fs = require('fs');

var responseProgress = require('./progress/responseProgress');

module.exports = function writeFile(res, src, dest, options, callback) {
  var basename = typeof src === 'string' ? path.basename(src) : src.basename || src.filename || '';
  var entry = {
    basename: basename,
    fullPath: path.join(dest, basename),
  };
  responseProgress(res, src, entry, options, function (err, res) {
    if (err) return callback(err);
    res = res.pipe(fs.createWriteStream(entry.fullPath));
    res.on('error', callback);
    res.on('close', function () {
      callback(null, basename);
    });
  });
};
