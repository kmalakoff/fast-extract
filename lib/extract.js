var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp-classic');
var DecompressZip = require('decompress-zip');
var fsWriteStreamAtomic = require('fs-write-stream-atomic');
var tarStream = require('tar-stream');
var once = require('once');

var atomicCallbackFn = require('./atomicCallbackFn');
var extname = require('./completeExtname');
var streamExtractors = require('./streamExtractors');
var tempFilename = require('./tempFilename');

var TMP_DIR = path.join(require('osenv').home(), '.tmp');

// shim
if (typeof Buffer.from === 'undefined')
  Buffer.from = function (data) {
    // eslint-disable-next-line node/no-deprecated-api
    return new Buffer(data);
  };

module.exports = function extract(src, dest, options, callback) {
  var filename = options.filename || src;
  var extension = options.extension || extname(filename);
  if (!extension) return callback(new Error('Cannot determine extract type for ' + src));
  if (extension[0] === '.') extension = extension.slice(1);
  callback = atomicCallbackFn(dest, callback);

  // TODO: no inplace edit
  if (typeof options.strip === 'undefined') options.strip = 0;
  var res = typeof src === 'string' ? fs.createReadStream(src) : src;
  var extractors = streamExtractors(extension, dest, options, res);
  for (var index = 0; index < extractors.length; index++) res = res.pipe(extractors[index]);

  if (extension === 'zip') {
    var tempSrc = path.join(TMP_DIR, tempFilename(), 'file' + extension);
    mkdirp(path.dirname(tempSrc), function () {
      callback = atomicCallbackFn(path.dirname(tempSrc), false, callback);
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
        zip.on('error', function (err) {
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
  } else if (~extension.indexOf('tar') || ~extension.indexOf('tgz')) {
    var extract = tarStream.extract();
    var files = [];

    extract.on('entry', function (header, stream, callback) {
      callback = once(callback);

      var chunks = [];
      stream.on('data', function (chunk) {
        chunks.push(chunk);
      });
      stream.on('error', callback);
      stream.on('end', function () {
        var file = {
          data: Buffer.concat(chunks),
          mode: header.mode,
          mtime: header.mtime,
          path: header.name,
          type: header.type,
        };

        if (header.type === 'symlink' || header.type === 'link') {
          file.linkname = header.linkname;
        }

        files.push(file);
        callback();
      });
    });

    extract.on('finish', function () {
      // var now = new Date();

      // console.log('files', files);
      files.map(function (file) {
        // var mode = file.mode & ~process.umask();

        var dir = file.path.split('/');
        if (options.strip > dir.length) {
          throw new Error('You cannot strip more levels than there are directories');
        } else {
          dir = dir.slice(options.strip);
        }
        var fullPath = path.join(dest, dir.join(path.sep));
        var targetPath = null;
        if (file.linkname) {
          dir.pop();
          targetPath = path.join(dest, dir.join(path.sep), file.linkname);
        }

        if (file.type === 'directory') mkdirp.sync(fullPath);
        else if (file.type === 'file') fs.writeFileSync(fullPath, file.data);
        else if (file.type === 'link') fs.linkSync(targetPath, fullPath);
        else if (file.type === 'symlink') fs.symlinkSync(targetPath, fullPath);
      });

      callback(null, filename);
    });
    extract.on('error', function (err) {
      console.log(err);
    });
    res = res.pipe(extract);
  } else {
    if (!extractors.length) res = res.pipe(fsWriteStreamAtomic(path.join(dest, filename)));
    res.on('error', callback);
    res.on('close', function () {
      callback(null, filename);
    });
  }
};
