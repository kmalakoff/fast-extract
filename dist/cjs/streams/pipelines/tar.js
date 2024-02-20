"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return createTarPipeline;
    }
});
var _EntryProgress = /*#__PURE__*/ _interop_require_default(require("../transforms/EntryProgress.js"));
var _PathToData = /*#__PURE__*/ _interop_require_default(require("../transforms/PathToData.js"));
var _Tar = /*#__PURE__*/ _interop_require_default(require("../transforms/Tar.js"));
var _entries = /*#__PURE__*/ _interop_require_default(require("../write/entries.js"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function createTarPipeline(dest, streams, options) {
    var isPath = typeof options.source === "string";
    streams = streams.slice();
    !isPath || streams.unshift(new _PathToData.default());
    streams.push(new _Tar.default());
    !options.progress || streams.push(new _EntryProgress.default(options));
    streams.push((0, _entries.default)(dest, options));
    return streams;
}
/* CJS INTEROP */ if (exports.__esModule && exports.default) { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) exports.default[key] = exports[key]; module.exports = exports.default; }