const bz2 = require('unbzip2-stream');
const zlib = require('zlib');

// lzma-native module compatiblity starts at Node 6
const major = +process.versions.node.split('.')[0];
const lzmaNative = major >= 10 ? require('./optionalRequire.cjs')('lzma-native') : null;

module.exports = function decompressorsByType(type) {
  const parts = type.split('.').reverse();
  const streams = [];
  for (let index = 0; index < parts.length; index++) {
    const part = parts[index];
    if (part === 'bz2') streams.push(bz2());
    else if (part === 'xz' && lzmaNative) streams.push(lzmaNative.createDecompressor());
    else if (part === 'tgz' || part === 'gz') streams.push(zlib.createUnzip());
  }
  return streams;
};
