"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return createZipPipeline;
    }
});
var _EntryProgress = /*#__PURE__*/ _interop_require_default(require("../transforms/EntryProgress.js"));
var _PathToData = /*#__PURE__*/ _interop_require_default(require("../transforms/PathToData.js"));
var _WriteFile = /*#__PURE__*/ _interop_require_default(require("../transforms/WriteFile.js"));
var _Zip = /*#__PURE__*/ _interop_require_default(require("../transforms/Zip.js"));
var _entries = /*#__PURE__*/ _interop_require_default(require("../write/entries.js"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function createZipPipeline(dest, streams, options) {
    var isPath = typeof options.source === 'string';
    streams = streams.slice();
    if (isPath) {
        if (streams.length) {
            streams.unshift(new _PathToData.default());
            streams.push(new _WriteFile.default(dest, options));
        }
    } else {
        streams.push(new _WriteFile.default(dest, options));
    }
    streams.push(new _Zip.default());
    !options.progress || streams.push(new _EntryProgress.default(options));
    streams.push((0, _entries.default)(dest, options));
    return streams;
}
/* CJS INTEROP */ if (exports.__esModule && exports.default) { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) exports.default[key] = exports[key]; module.exports = exports.default; }