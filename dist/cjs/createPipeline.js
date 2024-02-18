"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return createPipeline;
    }
});
var _zlib = /*#__PURE__*/ _interop_require_default(require("zlib"));
var _unbzip2stream = /*#__PURE__*/ _interop_require_default(require("unbzip2-stream"));
var _optionalRequirecjs = /*#__PURE__*/ _interop_require_default(require("./optionalRequire.js"));
var _file = /*#__PURE__*/ _interop_require_default(require("./streams/pipelines/file.js"));
var _tar = /*#__PURE__*/ _interop_require_default(require("./streams/pipelines/tar.js"));
var _zip = /*#__PURE__*/ _interop_require_default(require("./streams/pipelines/zip.js"));
var _DestinationNotExists = /*#__PURE__*/ _interop_require_default(require("./streams/transforms/DestinationNotExists.js"));
var _DestinationRemove = /*#__PURE__*/ _interop_require_default(require("./streams/transforms/DestinationRemove.js"));
var _extname = /*#__PURE__*/ _interop_require_default(require("./extname.js"));
var _basename = /*#__PURE__*/ _interop_require_default(require("./sourceStats/basename"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
// lzma-native module compatiblity starts at Node 6
var major = +process.versions.node.split(".")[0];
var lzmaNative = major >= 10 ? (0, _optionalRequirecjs.default)("lzma-native") : null;
var TRANSORMS = {
    bz2: _unbzip2stream.default,
    tgz: _zlib.default.createUnzip.bind(_zlib.default),
    gz: _zlib.default.createUnzip.bind(_zlib.default),
    xz: lzmaNative && lzmaNative.createDecompressor ? lzmaNative.createDecompressor.bind(lzmaNative) : undefined
};
var WRITERS = {
    zip: _zip.default,
    tar: _tar.default,
    tgz: _tar.default
};
function createPipeline(dest, options) {
    var type = options.type === undefined ? (0, _extname.default)((0, _basename.default)(options.source, options) || "") : options.type;
    var parts = type.split(".");
    var streams = [
        options.force ? new _DestinationRemove.default(dest) : new _DestinationNotExists.default(dest)
    ];
    for(var index = parts.length - 1; index >= 0; index--){
        // append transform
        var transform = TRANSORMS[parts[index]];
        if (transform) streams.push(transform());
        // finish with a write stream
        var writer = WRITERS[parts[index]];
        if (writer) return writer(dest, streams, options);
    }
    // default is to write the result to a file
    return (0, _file.default)(dest, streams, options);
}
/* CJS INTEROP */ if (exports.__esModule && exports.default) { module.exports = exports.default; for (var key in exports) module.exports[key] = exports[key]; }