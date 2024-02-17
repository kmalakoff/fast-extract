"use strict";
function _instanceof(left, right) {
    if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
        return !!right[Symbol.hasInstance](left);
    } else {
        return left instanceof right;
    }
}
var path = require("path");
var fs = require("fs");
var Transform = require("stream").Transform;
var util = require("util");
var mkpath = require("mkpath");
var tempSuffix = require("temp-suffix");
function WriteFileTransform(dest, options) {
    if (!_instanceof(this, WriteFileTransform)) return new WriteFileTransform(options);
    options = Object.assign({
        objectMode: true
    }, options || {});
    Transform.call(this, options);
    this.tempPath = tempSuffix(dest);
    options._tempPaths.push(this.tempPath);
}
util.inherits(WriteFileTransform, Transform);
WriteFileTransform.prototype._transform = function _transform(chunk, encoding, callback) {
    var _this = this;
    if (this.stream) return this.stream.write(chunk, encoding, function() {
        callback();
    });
    mkpath(path.dirname(this.tempPath), function(err) {
        if (err) return callback(err);
        _this.stream = fs.createWriteStream(_this.tempPath, {
            flags: "w"
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
module.exports = WriteFileTransform;

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  for (var key in exports) exports.default[key] = exports[key];
  module.exports = exports.default;
}