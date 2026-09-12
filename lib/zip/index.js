var path = require('path');
var fs = require('fs');
var mkpath = require('mkpath');
var stream = require('stream');
if (typeof setimmediate === 'undefined') global.setImmediate = require('next-tick');
if (!stream.Readable) {
  var legacyStream = require('readable-stream');
  stream.Readable = legacyStream.Readable;
  stream.Writable = legacyStream.Writable;
  stream.Transform = legacyStream.Transform;
  stream.PassThrough = legacyStream.PassThrough;
}
var yauzl = require('yauzl');

var atomicCallbackFn = require('../safe/atomicCallbackFn');
var createEntry = require('./createEntry');
var tempFilename = require('../tempFilename');
var processEntries = require('../extract/processEntries');

var TMP_DIR = path.join(require('osenv').home(), '.tmp');

module.exports = function extractZip(res, dest, options, callback) {
  var tempSrc = path.join(TMP_DIR, tempFilename('file.zip'));
  mkpath(path.dirname(tempSrc), function () {
    callback = atomicCallbackFn(path.dirname(tempSrc), false, callback);
    res = res.pipe(fs.createWriteStream(tempSrc));
    res.on('error', callback);
    res.on('close', function () {
      yauzl.open(tempSrc, { lazyEntries: true }, function (err, extract) {
        if (err) return callback(err);

        var onEntry = function (header, entryCallback) {
          var entry = createEntry(header);
          extract.openReadStream(header, function (err, stream) {
            if (err) return entryCallback(err);
            entryCallback(entry, stream, function (err) {
              if (err) return callback(err);
              extract.readEntry();
            });
          });
        };
        processEntries({ extract: extract, onEntry: onEntry, close: 'close' }, dest, options, callback);
        extract.readEntry();
      });
    });
  });
};
