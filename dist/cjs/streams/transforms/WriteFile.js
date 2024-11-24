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
var _path = /*#__PURE__*/ _interop_require_default(require("path"));
var _stream = require("stream");
var _util = /*#__PURE__*/ _interop_require_default(require("util"));
var _mkpath = /*#__PURE__*/ _interop_require_default(require("mkpath"));
var _tempsuffix = /*#__PURE__*/ _interop_require_default(require("temp-suffix"));
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
function WriteFileTransform(dest, options) {
    if (!_instanceof(this, WriteFileTransform)) return new WriteFileTransform(options);
    options = Object.assign({
        objectMode: true
    }, options || {});
    _stream.Transform.call(this, options);
    this.tempPath = (0, _tempsuffix.default)(dest);
    options._tempPaths.push(this.tempPath);
}
_util.default.inherits(WriteFileTransform, _stream.Transform);
WriteFileTransform.prototype._transform = function _transform(chunk, encoding, callback) {
    var _this = this;
    if (this.stream) return this.stream.write(chunk, encoding, function() {
        callback();
    });
    (0, _mkpath.default)(_path.default.dirname(this.tempPath), function(err) {
        if (err) return callback(err);
        _this.stream = _fs.default.createWriteStream(_this.tempPath, {
            flags: 'w'
        });
        _this.stream.write(chunk, encoding, function() {
            callback();
        });
    });
};
WriteFileTransform.prototype._flush = function _flush(callback) {
    var _this = this;
    if (!this.stream) return callback();
    this.stream.end(function() {
        _this.stream = null;
        _this.push(_this.tempPath);
        _this.push(null);
        callback();
    });
};
WriteFileTransform.prototype.destroy = function destroy(err) {
    if (this.stream) {
        this.stream.end(err);
        this.stream = null;
    }
};
var _default = WriteFileTransform;
/* CJS INTEROP */ if (exports.__esModule && exports.default) { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) exports.default[key] = exports[key]; module.exports = exports.default; }