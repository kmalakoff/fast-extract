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
var _stream = require("stream");
var _util = /*#__PURE__*/ _interop_require_default(require("util"));
var _rimraf = /*#__PURE__*/ _interop_require_default(require("rimraf"));
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
function DestinationRemove(dest, options) {
    if (!_instanceof(this, DestinationRemove)) return new DestinationRemove(options);
    options = options ? Object.assign({}, options, {
        objectMode: true
    }) : {
        objectMode: true
    };
    _stream.Transform.call(this, options);
    this.dest = dest;
}
_util.default.inherits(DestinationRemove, _stream.Transform);
DestinationRemove.prototype._transform = function _transform(chunk, encoding, callback) {
    var _this = this;
    if (this.removed) return callback(null, chunk, encoding);
    (0, _rimraf.default)(this.dest, function(err) {
        _this.removed = true;
        err && err.code !== "EEXIST" ? callback(err) : callback(null, chunk, encoding);
    });
};
var _default = DestinationRemove;
/* CJS INTEROP */ if (exports.__esModule && exports.default) { module.exports = exports.default; for (var key in exports) module.exports[key] = exports[key]; }