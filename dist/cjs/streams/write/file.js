"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return createFilePipeline;
    }
});
var _fs = /*#__PURE__*/ _interop_require_default(require("fs"));
var _path = /*#__PURE__*/ _interop_require_default(require("path"));
var _flushwritestream = /*#__PURE__*/ _interop_require_default(require("flush-write-stream"));
var _mkpath = /*#__PURE__*/ _interop_require_default(require("mkpath"));
var _queuecb = /*#__PURE__*/ _interop_require_default(require("queue-cb"));
var _tempsuffix = /*#__PURE__*/ _interop_require_default(require("temp-suffix"));
var _writeTruncateFile = /*#__PURE__*/ _interop_require_default(require("../../writeTruncateFile.js"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function createFilePipeline(dest, options) {
    var tempDest = (0, _tempsuffix.default)(dest);
    options._tempPaths.push(tempDest);
    var wroteSomething = false;
    return (0, _flushwritestream.default)(function write(chunk, _encoding, callback) {
        var _this = this;
        wroteSomething = true;
        var appendFile = _fs.default.appendFile.bind(_fs.default, tempDest, chunk, callback);
        if (this.pathMade) return appendFile();
        (0, _mkpath.default)(_path.default.dirname(tempDest), function() {
            _this.pathMade = true;
            appendFile();
        });
    }, function flush(callback) {
        var queue = new _queuecb.default(1);
        queue.defer(function(callback) {
            (0, _mkpath.default)(_path.default.dirname(dest), function(err) {
                err && err.code !== "EEXIST" ? callback(err) : callback();
            });
        });
        wroteSomething ? queue.defer(_fs.default.rename.bind(_fs.default, tempDest, dest)) : queue.defer(_writeTruncateFile.default.bind(null, dest));
        queue.await(callback);
    });
}
/* CJS INTEROP */ if (exports.__esModule && exports.default) { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) exports.default[key] = exports[key]; module.exports = exports.default; }