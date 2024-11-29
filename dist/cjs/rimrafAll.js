"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return rimrafAll;
    }
});
var _queuecb = /*#__PURE__*/ _interop_require_default(require("queue-cb"));
var _rimraf2 = /*#__PURE__*/ _interop_require_default(require("rimraf2"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function rimrafAll(fullPaths, callback) {
    if (!fullPaths.length) return callback();
    var queue = new _queuecb.default(1);
    for(var index = 0; index < fullPaths.length; index++){
        (function(fullPath) {
            queue.defer(function(callback) {
                (0, _rimraf2.default)(fullPath, {
                    disableGlob: true
                }, function(err) {
                    err && err.code !== 'ENOENT' ? callback(err) : callback();
                });
            });
        })(fullPaths[index]);
    }
    queue.await(callback);
}
/* CJS INTEROP */ if (exports.__esModule && exports.default) { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) exports.default[key] = exports[key]; module.exports = exports.default; }