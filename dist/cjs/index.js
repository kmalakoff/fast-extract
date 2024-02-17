"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    createWriteStream: function() {
        return _createWriteStreamcjs.default;
    },
    default: function() {
        return fastExtract;
    }
});
var _extractcjs = /*#__PURE__*/ _interop_require_default(require("./extract.js"));
var _createWriteStreamcjs = /*#__PURE__*/ _interop_require_default(require("./createWriteStream.js"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function fastExtract(src, dest, options, callback) {
    if (options === undefined && typeof dest !== "string") {
        callback = options;
        options = dest;
        dest = null;
    }
    if (typeof options === "function") {
        callback = options;
        options = null;
    }
    if (typeof callback === "function") return (0, _extractcjs.default)(src, dest, options || {}, callback);
    return new Promise(function(resolve, reject) {
        fastExtract(src, dest, options, function(err, res) {
            err ? reject(err) : resolve(res);
        });
    });
}

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  for (var key in exports) exports.default[key] = exports[key];
  module.exports = exports.default;
}