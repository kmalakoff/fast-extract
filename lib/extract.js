var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp-classic');
var DecompressZip = require('decompress-zip');
var fsWriteStreamAtomic = require('fs-write-stream-atomic');
var crypto = require('crypto');
var extname = require('path-complete-extname');

var streamExtractors = require('./streamExtractors');

var TMP_DIR = path.join(require('osenv').home(), '.tmp');

module.exports = function extract(src, dest, options, callback) {
  var filename = options.filename || src;
  var extension = options.extension || extname(filename);
  if (!extension) return callback(new Error('Cannot determine extract type for ' + src));

  var res = fs.createReadStream(src);
  var tmpBasename = crypto
    .createHash('md5')
    .update(dest)
    .update('' + new Date().valueOf())
    .digest('hex')
    .slice(0, 24);
  var tempTarget = path.join(TMP_DIR, tmpBasename, 'file' + extension);

  if (extension === '.zip') {
    mkdirp(path.dirname(tempTarget), function () {
      res = res.pipe(fs.createWriteStream(tempTarget));
      res.on('error', function (err) {
        callback(err);
      });
      res.on('close', function () {
        var zip = new DecompressZip(tempTarget);
        // zip.on('progress', function (i, numFiles) {});
        zip.on('extract', function () {
          callback(null, filename);
        });
        zip.on('error', function (err) {
          console.log(err);
          callback(err);
        });
        zip.extract({
          path: dest,
          strip: options.strip || 0,
          filter: function (file) {
            return file.type !== 'Directory';
          },
        });
      });
    });
  } else {
    var extractors = streamExtractors(extension, dest, options, res);
    if (!extractors.length) extractors.push(fsWriteStreamAtomic(path.join(dest, filename)));
    for (var index = 0; index < extractors.length; index++) res = res.pipe(extractors[index]);
    res.on('error', callback);
    res.on('close', function () {
      callback(null, filename);
    });
  }
};
