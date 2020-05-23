var tar = require('tar');
var bz2 = require('unbzip2-stream');

var lzmaNative;
function lzmaNativeLazy() {
  if (!lzmaNative) lzmaNative = require('lzma-native');
  return lzmaNative;
}

module.exports = function inferExtractors(extension, dest, options) {
  var parts = extension.split('.').reverse();
  var extractors = [];
  for (var index = 0; index < parts.length; index++) {
    var part = parts[index];
    if (part === 'xz') extractors.push(lzmaNativeLazy().createDecompressor());
    else if (part === 'bz2') extractors.push(bz2());
    else if (part === 'tar' || part === 'tgz') {
      extractors.push(
        tar.x({
          strip: options.strip || 0,
          cwd: dest,
        })
      );
    }
  }
  return extractors;
};
