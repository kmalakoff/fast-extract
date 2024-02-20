"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return createWriteEntriesStream;
    }
});
var _fs = /*#__PURE__*/ _interop_require_default(require("fs"));
var _flushwritestream = /*#__PURE__*/ _interop_require_default(require("flush-write-stream"));
var _queuecb = /*#__PURE__*/ _interop_require_default(require("queue-cb"));
var _tempsuffix = /*#__PURE__*/ _interop_require_default(require("temp-suffix"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function createWriteEntriesStream(dest, options) {
    options = Object.assign({
        now: new Date()
    }, options);
    var tempDest = (0, _tempsuffix.default)(dest);
    var links = [];
    return (0, _flushwritestream.default)({
        objectMode: true
    }, function write(entry, _encoding, callback) {
        if (entry.type === "link") {
            links.unshift(entry);
            return callback();
        }
        if (entry.type === "symlink") {
            links.push(entry);
            return callback();
        }
        entry.create(tempDest, options, callback);
    }, function flush(callback) {
        var queue = new _queuecb.default(1);
        queue.defer(_fs.default.rename.bind(_fs.default, tempDest, dest));
        var entry;
        for(var index = 0; index < links.length; index++){
            entry = links[index];
            queue.defer(entry.create.bind(entry, dest, options));
        }
        queue.await(callback);
    });
}
/* CJS INTEROP */ if (exports.__esModule && exports.default) { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) exports.default[key] = exports[key]; module.exports = exports.default; }