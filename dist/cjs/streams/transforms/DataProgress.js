"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return DataProgressTransform;
    }
});
var _progressstream = /*#__PURE__*/ _interop_require_default(require("progress-stream"));
var _size = /*#__PURE__*/ _interop_require_default(require("../../sourceStats/size"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function DataProgressTransform(options) {
    var stats = {
        basename: options.basename
    };
    var progress = (0, _progressstream.default)({
        time: options.time
    }, function(update) {
        options.progress(Object.assign({
            progress: "write"
        }, update, stats));
    });
    (0, _size.default)(options.source, options, function(err, size) {
        err || progress.setLength(size || 0);
    });
    return progress;
}
/* CJS INTEROP */ if (exports.__esModule && exports.default) { module.exports = exports.default; for (var key in exports) module.exports[key] = exports[key]; }