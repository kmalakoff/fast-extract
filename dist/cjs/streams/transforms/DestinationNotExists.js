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
function DestinationNotExists(dest, options) {
    if (!_instanceof(this, DestinationNotExists)) return new DestinationNotExists(options);
    options = options ? Object.assign({}, options, {
        objectMode: true
    }) : {
        objectMode: true
    };
    _stream.Transform.call(this, options);
    this.dest = dest;
}
_util.default.inherits(DestinationNotExists, _stream.Transform);
DestinationNotExists.prototype._transform = function _transform(chunk, encoding, callback) {
    var _this = this;
    if (this.ready) return callback(null, chunk, encoding);
    _fs.default.readdir(this.dest, function(dirErr, names) {
        _this.ready = true;
        var err = !dirErr && names.length ? new Error("Cannot overwrite ".concat(_this.dest, " without force option")) : null;
        err ? callback(err) : callback(null, chunk, encoding);
    });
};
var _default = DestinationNotExists;
/* CJS INTEROP */ if (exports.__esModule && exports.default) { try { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) { exports.default[key] = exports[key]; } } catch (_) {}; module.exports = exports.default; }