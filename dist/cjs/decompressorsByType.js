"use strict";
var bz2 = require("unbzip2-stream");
var zlib = require("zlib");
// lzma-native module compatiblity starts at Node 6
var major = +process.versions.node.split(".")[0];
var lzmaNative = major >= 10 ? require("./optionalRequire.js")("lzma-native") : null;
module.exports = function decompressorsByType(type) {
    var parts = type.split(".").reverse();
    var streams = [];
    for(var index = 0; index < parts.length; index++){
        var part = parts[index];
        if (part === "bz2") streams.push(bz2());
        else if (part === "xz" && lzmaNative) streams.push(lzmaNative.createDecompressor());
        else if (part === "tgz" || part === "gz") streams.push(zlib.createUnzip());
    }
    return streams;
};

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  for (var key in exports) exports.default[key] = exports[key];
  module.exports = exports.default;
}