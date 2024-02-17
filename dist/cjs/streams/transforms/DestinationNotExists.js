"use strict";
function _instanceof(left, right) {
    if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
        return !!right[Symbol.hasInstance](left);
    } else {
        return left instanceof right;
    }
}
var Transform = require("stream").Transform;
var fs = require("fs");
var util = require("util");
function DestinationNotExists(dest, options) {
    if (!_instanceof(this, DestinationNotExists)) return new DestinationNotExists(options);
    options = options ? Object.assign({}, options, {
        objectMode: true
    }) : {
        objectMode: true
    };
    Transform.call(this, options);
    this.dest = dest;
}
util.inherits(DestinationNotExists, Transform);
DestinationNotExists.prototype._transform = function _transform(chunk, encoding, callback) {
    var _this = this;
    if (this.ready) return callback(null, chunk, encoding);
    fs.readdir(this.dest, function(dirErr, names) {
        _this.ready = true;
        var err = !dirErr && names.length ? new Error("Cannot overwrite ".concat(_this.dest, " without force option")) : null;
        err ? callback(err) : callback(null, chunk, encoding);
    });
};
module.exports = DestinationNotExists;

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  for (var key in exports) exports.default[key] = exports[key];
  module.exports = exports.default;
}