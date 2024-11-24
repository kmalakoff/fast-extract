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
var _zipiterator = /*#__PURE__*/ _interop_require_default(require("zip-iterator"));
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
function ZipTransform(options) {
    if (!_instanceof(this, ZipTransform)) return new ZipTransform(options);
    options = Object.assign({
        objectMode: true
    }, options || {});
    _stream.Transform.call(this, options);
}
_util.default.inherits(ZipTransform, _stream.Transform);
ZipTransform.prototype._transform = function _transform(chunk, _encoding, callback) {
    var _this = this;
    var fullPath = typeof chunk === 'string' ? chunk : chunk.toString();
    this._iterator = new _zipiterator.default(fullPath);
    this._iterator.forEach(this.push.bind(this), {
        concurrency: 1
    }, function(err) {
        if (!_this._iterator) return;
        err || _this.push(null);
        _this._iterator.destroy();
        _this._iterator = null;
        _this._callback ? _this._callback(err) : _this.end(err);
        _this._callback = null;
        callback(err);
    });
};
ZipTransform.prototype._flush = function _flush(callback) {
    if (!this._iterator) return callback();
    this._callback = callback;
    this._iterator.end();
};
ZipTransform.prototype.destroy = function destroy(err) {
    if (this._iterator) {
        var iterator = this._iterator;
        this._iterator = null;
        iterator.destroy(err);
        this.end(err);
    }
};
var _default = ZipTransform;
/* CJS INTEROP */ if (exports.__esModule && exports.default) { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) exports.default[key] = exports[key]; module.exports = exports.default; }