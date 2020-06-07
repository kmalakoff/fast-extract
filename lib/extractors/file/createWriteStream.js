var path = require('path');
var fs = require('fs');
var progressStream = require('progress-stream');
var pumpify = require('pumpify');
var crypto = require('crypto');

module.exports = function createWriteFileStream(dest, transforms, options) {
  var basename = options.basename || options.filename || crypto.randomBytes(16).toString('hex');
  var fullPath = path.join(dest, basename);

  if (options.progress) {
    var progress = progressStream({
      time: options.time,
    });
    progress.on('progress', function (update) {
      update.progress = 'write';
      update.basename = basename;
      update.fullPath = fullPath;
      options.progress(update);
    });
    transforms = transforms.concat([progress]);
  }

  transforms = transforms.concat([fs.createWriteStream(fullPath)]);
  return transforms.length === 1 ? transforms[0] : pumpify(transforms);
};
