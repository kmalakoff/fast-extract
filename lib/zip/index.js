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
var assign = require('object-assign');
var once = require('once');
var Queue = require('queue-cb');
var throttle = require('lodash.throttle');

var createDirectory = require('../extract/createDirectory');
var createFile = require('../extract/createFile');
var createLink = require('../extract/createLink');
var createEntry = require('./createEntry');

var atomicCallbackFn = require('../safe/atomicCallbackFn');
var tempFilename = require('../tempFilename');

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

        var done = false;
        var links = [];
        var errors = [];
        options = assign({ now: new Date() }, options);

        var progress = null;
        if (options.progress) {
          progress = function (entry) {
            if (done) return; // throttle can call after done
            entry.progress = 'extract';
            options.progress(entry);
          };
          if (options.time) progress = throttle(progress, options.time, { leading: true });
        }

        extract.on('entry', function (header) {
          var callback = once(function (err) {
            if (err) errors.push(err);
            extract.readEntry();
          });

          createEntry(header, dest, extract, options, function (err, entry) {
            if (err) return callback(err);
            !progress || progress(entry);

            if (entry.type === 'directory') createDirectory(entry, options, callback);
            else if (entry.type === 'symlink' || entry.type === 'link') {
              links.push(entry);
              callback();
            } else if (entry.type === 'file') {
              extract.openReadStream(header, function (err, stream) {
                if (err) return callback(err);
                createFile(entry, stream, options, callback);
              });
            } else callback();
          });
        });

        extract.on('close', function () {
          done = true;
          if (errors.length) return callback(errors);
          var queue = new Queue();
          for (var index = 0; index < links.length; index++) queue.defer(createLink.bind(null, links[index], options));
          queue.await(callback);
        });
        extract.on('error', callback);
        extract.readEntry();
      });
    });
  });
};
