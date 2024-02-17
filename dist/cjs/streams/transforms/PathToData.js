"use strict";
function _instanceof(left, right) {
    if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
        return !!right[Symbol.hasInstance](left);
    } else {
        return left instanceof right;
    }
}
var fs = require("fs");
var Transform = require("stream").Transform;
var util = require("util");
var eos = require("end-of-stream");
function PathToData(options) {
    if (!_instanceof(this, PathToData)) return new PathToData(options);
    Transform.call(this, options || {});
}
util.inherits(PathToData, Transform);
PathToData.prototype._transform = function _transform(chunk, _encoding, callback) {
    var self = this;
    var fullPath = typeof chunk === "string" ? chunk : chunk.toString();
    var stream = fs.createReadStream(fullPath);
    stream.on("data", function data(chunk) {
        self.push(chunk, "buffer");
    });
    eos(stream, function(err) {
        !err || self.push(null);
        callback(err);
    });
};
module.exports = PathToData;

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  for (var key in exports) exports.default[key] = exports[key];
  module.exports = exports.default;
}