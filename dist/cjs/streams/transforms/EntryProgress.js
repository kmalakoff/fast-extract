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
var throttle = require("lodash.throttle");
function EntryProgressTransform(options) {
    if (!_instanceof(this, EntryProgressTransform)) return new EntryProgressTransform();
    Transform.call(this, {
        objectMode: true
    });
    var done = false;
    this.progress = function progress(entry) {
        if (done) return; // throttle can call after done
        // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
        if (!entry) return done = true;
        options.progress(Object.assign({
            progress: "extract"
        }, entry));
    };
    if (options.time) this.progress = throttle(this.progress, options.time, {
        leading: true
    });
}
util.inherits(EntryProgressTransform, Transform);
EntryProgressTransform.prototype._transform = function _transform(entry, encoding, callback) {
    this.progress(entry);
    this.push(entry, encoding);
    callback();
};
EntryProgressTransform.prototype._flush = function _flush(callback) {
    this.progress(null);
    callback();
};
module.exports = EntryProgressTransform;

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  for (var key in exports) exports.default[key] = exports[key];
  module.exports = exports.default;
}