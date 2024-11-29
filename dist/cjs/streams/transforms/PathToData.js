"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
var _fs = /*#__PURE__*/ _interop_require_default(require("fs"));
var _stream = require("stream");
var _util = /*#__PURE__*/ _interop_require_default(require("util"));
var _endofstream = /*#__PURE__*/ _interop_require_default(require("end-of-stream"));
function _instanceof(left, right) {
    if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
        return !!right[Symbol.hasInstance](left);
    } else {
        return left instanceof right;
    }
}
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function PathToData(options) {
    if (!_instanceof(this, PathToData)) return new PathToData(options);
    _stream.Transform.call(this, options || {});
}
_util.default.inherits(PathToData, _stream.Transform);
PathToData.prototype._transform = function _transform(chunk, _encoding, callback) {
    var self = this;
    var fullPath = typeof chunk === 'string' ? chunk : chunk.toString();
    var stream = _fs.default.createReadStream(fullPath);
    stream.on('data', function data(chunk) {
        self.push(chunk, 'buffer');
    });
    (0, _endofstream.default)(stream, function(err) {
        !err || self.push(null);
        callback(err);
    });
};
var _default = PathToData;
/* CJS INTEROP */ if (exports.__esModule && exports.default) { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) exports.default[key] = exports[key]; module.exports = exports.default; }