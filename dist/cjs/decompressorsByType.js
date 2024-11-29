"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return decompressorsByType;
    }
});
var _zlib = /*#__PURE__*/ _interop_require_default(require("zlib"));
var _unbzip2stream = /*#__PURE__*/ _interop_require_default(require("unbzip2-stream"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
// lzma-native module compatiblity starts at Node 6
var major = +process.versions.node.split('.')[0];
var lzmaNative = major >= 10 ? require('./optionalRequire.js')('lzma-native') : null;
function decompressorsByType(type) {
    var parts = type.split('.').reverse();
    var streams = [];
    for(var index = 0; index < parts.length; index++){
        var part = parts[index];
        if (part === 'bz2') streams.push((0, _unbzip2stream.default)());
        else if (part === 'xz' && lzmaNative) streams.push(lzmaNative.createDecompressor());
        else if (part === 'tgz' || part === 'gz') streams.push(_zlib.default.createUnzip());
    }
    return streams;
}
/* CJS INTEROP */ if (exports.__esModule && exports.default) { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) exports.default[key] = exports[key]; module.exports = exports.default; }