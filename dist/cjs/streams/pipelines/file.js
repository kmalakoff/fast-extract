"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return createFilePipeline;
    }
});
var _path = /*#__PURE__*/ _interop_require_default(require("path"));
var _basename = /*#__PURE__*/ _interop_require_default(require("../../sourceStats/basename.js"));
var _DataProgress = /*#__PURE__*/ _interop_require_default(require("../transforms/DataProgress.js"));
var _PathToData = /*#__PURE__*/ _interop_require_default(require("../transforms/PathToData.js"));
var _file = /*#__PURE__*/ _interop_require_default(require("../write/file.js"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function createFilePipeline(dest, streams, options) {
    var isPath = typeof options.source === "string";
    var basename = (0, _basename.default)(options.source, options);
    var fullPath = basename === undefined ? dest : _path.default.join(dest, basename);
    streams = streams.slice();
    !isPath || streams.unshift(new _PathToData.default());
    !options.progress || streams.push(new _DataProgress.default(Object.assign({
        basename: basename,
        fullPath: fullPath
    }, options)));
    streams.push((0, _file.default)(fullPath, options));
    return streams;
}
/* CJS INTEROP */ if (exports.__esModule && exports.default) { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) exports.default[key] = exports[key]; module.exports = exports.default; }