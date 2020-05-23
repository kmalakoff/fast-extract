var tar = require('tar');
var xz = require('xz');
var bz2 = require('unbzip2-stream');

module.exports = function inferExtractors(extension, dest, options) {
  var parts = extension.split('.').reverse();
  var extractors = [];
  for (var index = 0; index < parts.length; index++) {
    switch (parts[index]) {
      case 'xz':
        extractors.push(new xz.Decompressor());
        break;
      case 'bz2':
        extractors.push(bz2());
        break;
      case 'tar':
      case 'tgz':
        extractors.push(
          tar.extract({
            strip: options.strip || 0,
            cwd: dest,
          })
        );
        break;
    }
  }
  return extractors;
};
