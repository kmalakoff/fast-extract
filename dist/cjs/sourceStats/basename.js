"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return getBasename;
    }
});
var _path = /*#__PURE__*/ _interop_require_default(require("path"));
var _contentdisposition = /*#__PURE__*/ _interop_require_default(require("content-disposition"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
// biome-ignore lint/suspicious/noControlCharactersInRegex: <explanation>
var POSIX = /[<>:"\\/\\|?*\x00-\x1F]/g;
var WINDOWS = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;
function getBasename(source, options, endpoint) {
    // options
    var basename = options.basename || options.filename;
    if (basename !== undefined) return basename;
    // path
    if (typeof source === "string") return _path.default.basename(source);
    // stream
    if (source) {
        if (source.headers && source.headers["content-disposition"]) {
            var information = _contentdisposition.default.parse(source.headers["content-disposition"]);
            return information.parameters.filename;
        }
        basename = source.basename || source.filename;
        if (basename !== undefined) return basename;
    }
    // endpoint
    if (endpoint) {
        basename = _path.default.basename(endpoint.split("?")[0]);
        basename = basename.replace(POSIX, "!");
        basename = basename.replace(WINDOWS, "!");
        return basename;
    }
}
/* CJS INTEROP */ if (exports.__esModule && exports.default) { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) exports.default[key] = exports[key]; module.exports = exports.default; }