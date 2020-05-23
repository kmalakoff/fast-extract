var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp-classic');
var DecompressZip = require('decompress-zip');
var fsWriteStreamAtomic = require('fs-write-stream-atomic');
var extname = require('path-complete-extname');

var atomicCallbackFn = require('./atomicCallbackFn');
var streamExtractors = require('./streamExtractors');
var tempFilename = require('./tempFilename');

var TMP_DIR = path.join(require('osenv').home(), '.tmp');

module.exports = function extract(src, dest, options, callback) {
  var filename = options.filename || src;
  var extension = options.extension || extname(filename);
  if (!extension) return callback(new Error('Cannot determine extract type for ' + src));

  var res = typeof src === 'string' ? fs.createReadStream(src) : src;
  if (extension === '.zip' || extension === 'zip') {
    // TODO: figure out to rename - the symlink for the zip is not sticking

    var tempSrc = path.join(TMP_DIR, tempFilename(), 'file' + extension);
    mkdirp(path.dirname(tempSrc), function () {
      callback = atomicCallbackFn(path.dirname(tempSrc), callback);

      res = res.pipe(fs.createWriteStream(tempSrc));
      res.on('error', function (err) {
        callback(err);
      });
      res.on('close', function () {
        var zip = new DecompressZip(tempSrc);
        // zip.on('progress', function (i, numFiles) {});
        zip.on('extract', function () {
          callback(null, filename);
        });
        zip.on('error', callback);
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
    var tempDest = path.join(TMP_DIR, tempFilename());
    mkdirp(tempDest, function () {
      callback = atomicCallbackFn(tempDest, dest, callback);
      var extractors = streamExtractors(extension, tempDest, options, res);
      if (!extractors.length) extractors.push(fsWriteStreamAtomic(path.join(dest, filename)));
      for (var index = 0; index < extractors.length; index++) res = res.pipe(extractors[index]);
      res.on('error', callback);
      res.on('close', function () {
        callback(null, filename);
      });
    });
  }
};
