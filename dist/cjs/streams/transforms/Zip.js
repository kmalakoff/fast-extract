"use strict";
function _instanceof(left, right) {
    if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
        return !!right[Symbol.hasInstance](left);
    } else {
        return left instanceof right;
    }
}
var Transform = require("stream").Transform;
var util = require("util");
var ZipIterator = require("zip-iterator");
function ZipTransform(options) {
    if (!_instanceof(this, ZipTransform)) return new ZipTransform(options);
    options = Object.assign({
        objectMode: true
    }, options || {});
    Transform.call(this, options);
}
util.inherits(ZipTransform, Transform);
ZipTransform.prototype._transform = function _transform(chunk, _encoding, callback) {
    var _this = this;
    var fullPath = typeof chunk === "string" ? chunk : chunk.toString();
    this._iterator = new ZipIterator(fullPath);
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
module.exports = ZipTransform;

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  for (var key in exports) exports.default[key] = exports[key];
  module.exports = exports.default;
}