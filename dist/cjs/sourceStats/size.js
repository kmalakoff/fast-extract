"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return getSize;
    }
});
var _fs = /*#__PURE__*/ _interop_require_default(require("fs"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function getSize(source, options, callback) {
    // options
    if (options.size !== undefined) return callback(null, options.size);
    // path
    if (typeof source === 'string') {
        return _fs.default.stat(source, function(err, stats) {
            err ? callback(err) : callback(null, stats.size);
        });
    }
    // stream
    if (source) {
        if (source.headers && source.headers['content-length']) return callback(null, +source.headers['content-length']);
        if (source.size) return callback(null, source.size);
    }
    callback();
}
/* CJS INTEROP */ if (exports.__esModule && exports.default) { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) exports.default[key] = exports[key]; module.exports = exports.default; }