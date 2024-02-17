"use strict";
function _instanceof(left, right) {
    if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
        return !!right[Symbol.hasInstance](left);
    } else {
        return left instanceof right;
    }
}
var Transform = require("stream").Transform;
var PassThrough = require("stream").PassThrough;
var util = require("util");
var TarIterator = require("tar-iterator");
function TarTransform(options) {
    if (!_instanceof(this, TarTransform)) return new TarTransform(options);
    options = Object.assign({
        objectMode: true
    }, options || {});
    Transform.call(this, options);
}
util.inherits(TarTransform, Transform);
TarTransform.prototype._transform = function _transform(chunk, encoding, callback) {
    var _this = this;
    if (this._stream) return this._stream.write(chunk, encoding, callback);
    this._stream = new PassThrough();
    this._iterator = new TarIterator(this._stream);
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
module.exports = TarTransform;

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  for (var key in exports) exports.default[key] = exports[key];
  module.exports = exports.default;
}