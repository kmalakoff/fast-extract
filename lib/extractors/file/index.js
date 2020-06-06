var path = require('path');
var fs = require('fs');
var eos = require('end-of-stream');

var responseProgress = require('../../progress/responseProgress');

module.exports = function writeFile(res, src, dest, options, callback) {
  var basename = typeof src === 'string' ? path.basename(src) : src.basename || src.filename || '';
  var entry = {
    basename: basename,
    fullPath: path.join(dest, basename),
  };
  responseProgress(res, src, entry, options, function (err, res) {
    if (err) return callback(err);
    res = res.pipe(fs.createWriteStream(entry.fullPath));
    eos(res, function (err) {
      err ? callback(err) : callback(null, basename);
    });
  });
};
