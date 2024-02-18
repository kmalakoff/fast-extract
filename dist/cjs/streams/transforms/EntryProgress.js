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
var _lodashthrottle = /*#__PURE__*/ _interop_require_default(require("lodash.throttle"));
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
function EntryProgressTransform(options) {
    if (!_instanceof(this, EntryProgressTransform)) return new EntryProgressTransform();
    _stream.Transform.call(this, {
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
    if (options.time) this.progress = (0, _lodashthrottle.default)(this.progress, options.time, {
        leading: true
    });
}
_util.default.inherits(EntryProgressTransform, _stream.Transform);
EntryProgressTransform.prototype._transform = function _transform(entry, encoding, callback) {
    this.progress(entry);
    this.push(entry, encoding);
    callback();
};
EntryProgressTransform.prototype._flush = function _flush(callback) {
    this.progress(null);
    callback();
};
var _default = EntryProgressTransform;
/* CJS INTEROP */ if (exports.__esModule && exports.default) { module.exports = exports.default; for (var key in exports) module.exports[key] = exports[key]; }