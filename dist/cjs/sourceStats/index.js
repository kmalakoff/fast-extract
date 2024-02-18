"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return sourceStats;
    }
});
var _basename = /*#__PURE__*/ _interop_require_default(require("./basename"));
var _size = /*#__PURE__*/ _interop_require_default(require("./size"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function sourceStats(source, options, endpoint, callback) {
    if (typeof endpoint === "function") {
        callback = endpoint;
        endpoint = null;
    }
    (0, _size.default)(source, options, function(err, size) {
        if (err) return callback(err);
        var stats = {};
        var basename = (0, _basename.default)(source, options, endpoint);
        if (basename !== undefined) stats.basename = basename;
        if (size !== undefined) stats.size = size;
        callback(null, stats);
    });
}
/* CJS INTEROP */ if (exports.__esModule && exports.default) { module.exports = exports.default; for (var key in exports) module.exports[key] = exports[key]; }