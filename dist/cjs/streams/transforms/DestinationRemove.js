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
var rimraf = require("rimraf");
function DestinationRemove(dest, options) {
    if (!_instanceof(this, DestinationRemove)) return new DestinationRemove(options);
    options = options ? Object.assign({}, options, {
        objectMode: true
    }) : {
        objectMode: true
    };
    Transform.call(this, options);
    this.dest = dest;
}
util.inherits(DestinationRemove, Transform);
DestinationRemove.prototype._transform = function _transform(chunk, encoding, callback) {
    var _this = this;
    if (this.removed) return callback(null, chunk, encoding);
    rimraf(this.dest, function(err) {
        _this.removed = true;
        err && err.code !== "EEXIST" ? callback(err) : callback(null, chunk, encoding);
    });
};
module.exports = DestinationRemove;

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  for (var key in exports) exports.default[key] = exports[key];
  module.exports = exports.default;
}