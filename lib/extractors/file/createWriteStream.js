var path = require('path');
var fs = require('fs');
var assign = require('object-assign');
var pumpify = require('pumpify');
var crypto = require('crypto');

var DataProgressTransform = require('../../progress/DataTransform');

module.exports = function createWriteFileStream(dest, transforms, options) {
  var basename = options.basename || options.filename || crypto.randomBytes(16).toString('hex');
  var fullPath = path.join(dest, basename);
  !options.progress || transforms.push(new DataProgressTransform(assign({ basename: basename, fullPath: fullPath }, options)));
  transforms.push(fs.createWriteStream(fullPath));
  return transforms.length === 1 ? transforms[0] : pumpify(transforms);
};
