var path = require('path');
var fs = require('fs');
var assign = require('object-assign');
var pumpify = require('pumpify');
var crypto = require('crypto');

var DataProgressTransform = require('../transforms/DataProgress');

module.exports = function createWriteFileStream(dest, decompressors, options) {
  var basename = options.basename || options.filename || crypto.randomBytes(16).toString('hex');
  var fullPath = path.join(dest, basename);

  var transforms = decompressors.slice();
  !options.progress || transforms.push(new DataProgressTransform(assign({ basename: basename, fullPath: fullPath }, options)));
  transforms.push(fs.createWriteStream(fullPath));
  return transforms.length === 1 ? transforms[0] : pumpify(transforms);
};
