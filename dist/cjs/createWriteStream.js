"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return createWriteStream;
    }
});
var _flushwritestream = /*#__PURE__*/ _interop_require_default(require("flush-write-stream"));
var _pumpify = /*#__PURE__*/ _interop_require_default(require("pumpify"));
var _createPipeline = /*#__PURE__*/ _interop_require_default(require("./createPipeline.js"));
var _exitCleanup = /*#__PURE__*/ _interop_require_default(require("./exitCleanup.js"));
var _rimrafAll = /*#__PURE__*/ _interop_require_default(require("./rimrafAll.js"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function createWriteStream(dest, options) {
    if (typeof options === "string") options = {
        type: options
    };
    options = Object.assign({
        _tempPaths: []
    }, options);
    var streams = (0, _createPipeline.default)(dest, options);
    var generatedFiles = [
        dest
    ].concat(options._tempPaths);
    generatedFiles.forEach(_exitCleanup.default.add);
    var error = null;
    var ended = false;
    function onError(err, callback) {
        if (error || ended) return callback(err);
        error = err;
        res.destroy(err);
        return (0, _rimrafAll.default)(generatedFiles, function(err2) {
            generatedFiles.forEach(_exitCleanup.default.remove);
            callback(err || err2);
        });
    }
    function onEnd(callback) {
        if (error || ended) return callback();
        ended = true;
        return (0, _rimrafAll.default)(options._tempPaths, function(err) {
            generatedFiles.forEach(_exitCleanup.default.remove);
            callback(err);
        });
    }
    var res = streams.length < 2 ? streams[0] : (0, _pumpify.default)(streams);
    var write = (0, _flushwritestream.default)(function write(chunk, encoding, callback) {
        res.write(chunk, encoding, function(err) {
            if (error) return; // skip if errored so will not  emit errors multiple times
            err ? onError(err, callback) : callback();
        });
    }, function flush(callback) {
        if (error) return; // skip if errored so will not emit errors multiple times
        res.end(function(err) {
            if (error) return; // skip if errored so will not emit errors multiple times
            err ? onError(err || error, callback) : onEnd(callback);
        });
    });
    res.on("error", function(err) {
        onError(err, function() {
            write.destroy(err);
        });
    });
    return write;
}
/* CJS INTEROP */ if (exports.__esModule && exports.default) { module.exports = exports.default; for (var key in exports) module.exports[key] = exports[key]; }