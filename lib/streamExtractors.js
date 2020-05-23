var bz2 = require('unbzip2-stream');
var gunzip = require('gunzip-maybe');

var lzmaNative = null;
try {
  lzmaNative = require('require_optional')('lzma-native');
} catch (err) {}

module.exports = function inferExtractors(extension, dest, options) {
  var parts = extension.split('.').reverse();
  var extractors = [];
  for (var index = 0; index < parts.length; index++) {
    var part = parts[index];
    if (part === 'bz2') extractors.push(bz2());
    else if (part === 'xz' && lzmaNative) extractors.push(lzmaNative.createDecompressor());
    else if (part === 'tgz' || part === 'gz') extractors.push(gunzip());
  }
  return extractors;
};