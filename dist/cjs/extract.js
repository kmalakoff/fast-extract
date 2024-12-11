"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return extract;
    }
});
var _calloncefn = /*#__PURE__*/ _interop_require_default(require("call-once-fn"));
var _endofstream = /*#__PURE__*/ _interop_require_default(require("end-of-stream"));
var _createWriteStream = /*#__PURE__*/ _interop_require_default(require("./createWriteStream.js"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function extract(source, dest, options, callback) {
    if (typeof options === 'string') options = {
        type: options
    };
    options = Object.assign({
        source: source
    }, options);
    var res = (0, _createWriteStream.default)(dest, options);
    // path
    if (typeof source === 'string') {
        callback = (0, _calloncefn.default)(callback);
        res.on('error', callback);
        res.write(source, 'utf8');
        return res.end(callback);
    }
    // stream
    return (0, _endofstream.default)(source.pipe(res), callback);
}
/* CJS INTEROP */ if (exports.__esModule && exports.default) { try { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) { exports.default[key] = exports[key]; } } catch (_) {}; module.exports = exports.default; }