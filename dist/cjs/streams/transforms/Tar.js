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
var _tariterator = /*#__PURE__*/ _interop_require_default(require("tar-iterator"));
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
function TarTransform(options) {
    if (!_instanceof(this, TarTransform)) return new TarTransform(options);
    options = Object.assign({
        objectMode: true
    }, options || {});
    _stream.Transform.call(this, options);
}
_util.default.inherits(TarTransform, _stream.Transform);
TarTransform.prototype._transform = function _transform(chunk, encoding, callback) {
    var _this = this;
    if (this._stream) return this._stream.write(chunk, encoding, callback);
    this._stream = new _stream.PassThrough();
    this._iterator = new _tariterator.default(this._stream);
    this._iterator.forEach(function(entry) {
        _this.push(entry);
    }, {
        concurrency: 1
    }, function(err) {
        if (!_this._iterator) return;
        err || _this.push(null);
        _this._stream = null;
        _this._iterator.destroy();
        _this._iterator = null;
        _this._callback ? _this._callback(err) : _this.end(err);
        _this._callback = null;
    });
    this._stream.write(chunk, encoding, callback);
};
TarTransform.prototype._flush = function _flush(callback) {
    if (!this._stream) return callback();
    this._callback = callback;
    this._stream.end();
    this._stream = null;
};
TarTransform.prototype.destroy = function destroy(err) {
    if (this._stream) {
        this._stream.end(err);
        this._stream = null;
    }
    if (this._iterator) {
        var iterator = this._iterator;
        this._iterator = null;
        iterator.destroy(err);
        this.end(err);
    }
};
var _default = TarTransform;
/* CJS INTEROP */ if (exports.__esModule && exports.default) { try { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) { exports.default[key] = exports[key]; } } catch (_) {}; module.exports = exports.default; }