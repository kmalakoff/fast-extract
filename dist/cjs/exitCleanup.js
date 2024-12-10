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
var _rimraf2 = /*#__PURE__*/ _interop_require_default(require("rimraf2"));
var _signalexit = /*#__PURE__*/ _interop_require_default(require("signal-exit"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
var fullPaths = [];
(0, _signalexit.default)(function exist(_code, _signal) {
    while(fullPaths.length){
        try {
            _rimraf2.default.sync(fullPaths.pop(), {
                disableGlob: true
            });
        } catch (_err) {}
    }
});
function add(fullPath) {
    fullPaths.push(fullPath);
}
function remove(fullPath) {
    var index = fullPaths.indexOf(fullPath);
    if (index < 0) console.log("Path does not exist for remove: ".concat(fullPath));
    fullPaths.splice(index, 1);
}
var _default = {
    add: add,
    remove: remove
};
/* CJS INTEROP */ if (exports.__esModule && exports.default) { try { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) { exports.default[key] = exports[key]; } } catch (_) {}; module.exports = exports.default; }