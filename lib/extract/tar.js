var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp-classic');
var tarStream = require('tar-stream');
var once = require('once');

module.exports = function extractTar(res, dest, options, callback) {
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

    callback();
  });
  extract.on('error', callback);
  res = res.pipe(extract);
  res.on('error', callback);
  res.on('close', function () {
    callback();
  });
};
