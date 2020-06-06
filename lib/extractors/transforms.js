var bz2 = require('unbzip2-stream');
var zlib = require('zlib');

// lzma-native module compatiblity starts at Node 6
var major = +process.versions.node.split('.')[0];
var lzmaNative = major >= 6 ? require('../optionalRequire')('lzma-native') : null;

module.exports = function inferExtractors(type, dest, options) {
  var parts = type.split('.').reverse();
  var extractors = [];
  for (var index = 0; index < parts.length; index++) {
    var part = parts[index];
    if (part === 'bz2') extractors.push(bz2());
    else if (part === 'xz' && lzmaNative) extractors.push(lzmaNative.createDecompressor());
    else if (part === 'tgz' || part === 'gz') extractors.push(zlib.createUnzip());
  }
  return extractors;
};
