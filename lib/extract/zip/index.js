var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp-classic');
var stream = require('stream');
if (typeof setimmediate === 'undefined') require('setimmediate');
if (!stream.Readable) {
  var legacyStream = require('readable-stream');
  stream.Readable = legacyStream.Readable;
  stream.Writable = legacyStream.Writable;
  stream.Transform = legacyStream.Transform;
  stream.PassThrough = legacyStream.PassThrough;
}
var yauzl = require('yauzl');

var atomicCallbackFn = require('../../atomicCallbackFn');
var createEntry = require('./createEntry');
var tempFilename = require('../../tempFilename');

var TMP_DIR = path.join(require('osenv').home(), '.tmp');

module.exports = function extractZip(res, dest, options, callback) {
  var tempSrc = path.join(TMP_DIR, tempFilename(), 'file.zip');
  mkdirp(path.dirname(tempSrc), function () {
    callback = atomicCallbackFn(path.dirname(tempSrc), false, callback);
    res = res.pipe(fs.createWriteStream(tempSrc));
    res.on('error', callback);
    res.on('close', function () {
      yauzl.open(tempSrc, { lazyEntries: true }, function (err, zipfile) {
        if (err) return callback(err);
        zipfile.readEntry();
        zipfile.on('entry', function (headers) {
          var entry = createEntry(headers);

          if (entry.type === 'directory') {
            // Directory file names end with '/'.
            // Note that entries for directories themselves are optional.
            // An entry's fileName implicitly requires its parent directories to exist.
            zipfile.readEntry();
          } else if (entry.type === 'file') {
            // // file entry
            // zipfile.openReadStream(entry, function (err, stream) {
            //   if (err) throw err;
            //   stream.on('end', function () {
            //     zipfile.readEntry();
            //   });
            //   stream.pipe(somewhere);
            // });
            zipfile.readEntry();
          } else {
            zipfile.readEntry();
          }
        });
        zipfile.on('close', function () {
          callback();
        });
        zipfile.on('error', callback);
      });
    });
  });
};
