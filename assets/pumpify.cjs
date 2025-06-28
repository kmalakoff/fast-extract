/* COMPATIBILITY POLYFILLS */

var major = +process.versions.node.split(".")[0];

var Buffer = require('safe-buffer').Buffer;
var BufferComparePolyfill = require("./buffer-compare.cjs");
var BufferCompare = major > 4 ? function (source) { return source.compare.apply(source, Array.prototype.slice.call(arguments, 1)); } : function (_source) { return BufferComparePolyfill.apply(null, Array.prototype.slice.call(arguments)); }

var MathTrunc = Math.trunc || function (val) { return val < 0 ? Math.ceil(val) : Math.floor(val); };
/* COMPATIBILITY POLYFILLS */
var require$$0 = require('stream');
var require$$2 = require('events');
var require$$0$1 = require('buffer');
var require$$1 = require('util');
var require$$11 = require('string_decoder');

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};
function getDefaultExportFromCjs(x) {
    return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var pumpify = {
    exports: {}
};

var once = {
    exports: {}
};

var wrappy_1;
var hasRequiredWrappy;
function requireWrappy() {
    if (hasRequiredWrappy) return wrappy_1;
    hasRequiredWrappy = 1;
    // Returns a wrapper function that returns a wrapped callback
    // The wrapper function should do some stuff, and return a
    // presumably different callback function.
    // This makes sure that own properties are retained, so that
    // decorations and such are not lost along the way.
    wrappy_1 = wrappy;
    function wrappy(fn, cb) {
        if (fn && cb) return wrappy(fn)(cb);
        if (typeof fn !== 'function') throw new TypeError('need wrapper function');
        Object.keys(fn).forEach(function(k) {
            wrapper[k] = fn[k];
        });
        return wrapper;
        function wrapper() {
            var args = new Array(arguments.length);
            for(var i = 0; i < args.length; i++){
                args[i] = arguments[i];
            }
            var ret = fn.apply(this, args);
            var _$cb = args[args.length - 1];
            if (typeof ret === 'function' && ret !== _$cb) {
                Object.keys(_$cb).forEach(function(k) {
                    ret[k] = _$cb[k];
                });
            }
            return ret;
        }
    }
    return wrappy_1;
}

var hasRequiredOnce;
function requireOnce() {
    if (hasRequiredOnce) return once.exports;
    hasRequiredOnce = 1;
    var wrappy = requireWrappy();
    once.exports = wrappy(once$1);
    once.exports.strict = wrappy(onceStrict);
    once$1.proto = once$1(function() {
        Object.defineProperty(Function.prototype, 'once', {
            value: function value() {
                return once$1(this);
            },
            configurable: true
        });
        Object.defineProperty(Function.prototype, 'onceStrict', {
            value: function value() {
                return onceStrict(this);
            },
            configurable: true
        });
    });
    function once$1(fn) {
        var f = function f1() {
            if (f.called) return f.value;
            f.called = true;
            return f.value = fn.apply(this, arguments);
        };
        f.called = false;
        return f;
    }
    function onceStrict(fn) {
        var f = function f1() {
            if (f.called) throw new Error(f.onceError);
            f.called = true;
            return f.value = fn.apply(this, arguments);
        };
        var name = fn.name || 'Function wrapped with `once`';
        f.onceError = name + " shouldn't be called more than once";
        f.called = false;
        return f;
    }
    return once.exports;
}

var endOfStream;
var hasRequiredEndOfStream;
function requireEndOfStream() {
    if (hasRequiredEndOfStream) return endOfStream;
    hasRequiredEndOfStream = 1;
    var once = requireOnce();
    var noop = function noop() {};
    var qnt = commonjsGlobal.Bare ? queueMicrotask : process.nextTick.bind(process);
    var isRequest = function isRequest(stream) {
        return stream.setHeader && typeof stream.abort === 'function';
    };
    var isChildProcess = function isChildProcess(stream) {
        return stream.stdio && Array.isArray(stream.stdio) && stream.stdio.length === 3;
    };
    var eos = function eos1(stream, opts, callback) {
        if (typeof opts === 'function') return eos(stream, null, opts);
        if (!opts) opts = {};
        callback = once(callback || noop);
        var ws = stream._writableState;
        var rs = stream._readableState;
        var readable = opts.readable || opts.readable !== false && stream.readable;
        var writable = opts.writable || opts.writable !== false && stream.writable;
        var cancelled = false;
        var onlegacyfinish = function onlegacyfinish() {
            if (!stream.writable) onfinish();
        };
        var onfinish = function onfinish() {
            writable = false;
            if (!readable) callback.call(stream);
        };
        var onend = function onend() {
            readable = false;
            if (!writable) callback.call(stream);
        };
        var onexit = function onexit(exitCode) {
            callback.call(stream, exitCode ? new Error('exited with error code: ' + exitCode) : null);
        };
        var onerror = function onerror(err) {
            callback.call(stream, err);
        };
        var onclose = function onclose() {
            qnt(onclosenexttick);
        };
        var onclosenexttick = function onclosenexttick() {
            if (cancelled) return;
            if (readable && !(rs && rs.ended && !rs.destroyed)) return callback.call(stream, new Error('premature close'));
            if (writable && !(ws && ws.ended && !ws.destroyed)) return callback.call(stream, new Error('premature close'));
        };
        var onrequest = function onrequest() {
            stream.req.on('finish', onfinish);
        };
        if (isRequest(stream)) {
            stream.on('complete', onfinish);
            stream.on('abort', onclose);
            if (stream.req) onrequest();
            else stream.on('request', onrequest);
        } else if (writable && !ws) {
            stream.on('end', onlegacyfinish);
            stream.on('close', onlegacyfinish);
        }
        if (isChildProcess(stream)) stream.on('exit', onexit);
        stream.on('end', onend);
        stream.on('finish', onfinish);
        if (opts.error !== false) stream.on('error', onerror);
        stream.on('close', onclose);
        return function() {
            cancelled = true;
            stream.removeListener('complete', onfinish);
            stream.removeListener('abort', onclose);
            stream.removeListener('request', onrequest);
            if (stream.req) stream.req.removeListener('finish', onfinish);
            stream.removeListener('end', onlegacyfinish);
            stream.removeListener('close', onlegacyfinish);
            stream.removeListener('finish', onfinish);
            stream.removeListener('exit', onexit);
            stream.removeListener('end', onend);
            stream.removeListener('error', onerror);
            stream.removeListener('close', onclose);
        };
    };
    endOfStream = eos;
    return endOfStream;
}

function _instanceof$9(left, right) {
    if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
        return !!right[Symbol.hasInstance](left);
    } else {
        return left instanceof right;
    }
}
var pump_1;
var hasRequiredPump;
function requirePump() {
    if (hasRequiredPump) return pump_1;
    hasRequiredPump = 1;
    var once = requireOnce();
    var eos = requireEndOfStream();
    var fs;
    try {
        fs = require('fs'); // we only need fs to get the ReadStream and WriteStream prototypes
    } catch (e) {}
    var noop = function noop() {};
    var ancient = typeof process === 'undefined' ? false : /^v?\.0/.test(process.version);
    var isFn = function isFn(fn) {
        return typeof fn === 'function';
    };
    var isFS = function isFS(stream) {
        if (!ancient) return false // newer node version do not need to care about fs is a special way
        ;
        if (!fs) return false // browser
        ;
        return (_instanceof$9(stream, fs.ReadStream || noop) || _instanceof$9(stream, fs.WriteStream || noop)) && isFn(stream.close);
    };
    var isRequest = function isRequest(stream) {
        return stream.setHeader && isFn(stream.abort);
    };
    var destroyer = function destroyer(stream, reading, writing, callback) {
        callback = once(callback);
        var closed = false;
        stream.on('close', function() {
            closed = true;
        });
        eos(stream, {
            readable: reading,
            writable: writing
        }, function(err) {
            if (err) return callback(err);
            closed = true;
            callback();
        });
        var destroyed = false;
        return function(err) {
            if (closed) return;
            if (destroyed) return;
            destroyed = true;
            if (isFS(stream)) return stream.close(noop) // use close for fs streams to avoid fd leaks
            ;
            if (isRequest(stream)) return stream.abort() // request.destroy just do .end - .abort is what we want
            ;
            if (isFn(stream.destroy)) return stream.destroy();
            callback(err || new Error('stream was destroyed'));
        };
    };
    var call = function call(fn) {
        fn();
    };
    var pipe = function pipe(from, to) {
        return from.pipe(to);
    };
    var pump = function pump() {
        var streams = Array.prototype.slice.call(arguments);
        var callback = isFn(streams[streams.length - 1] || noop) && streams.pop() || noop;
        if (Array.isArray(streams[0])) streams = streams[0];
        if (streams.length < 2) throw new Error('pump requires two streams per minimum');
        var error;
        var destroys = streams.map(function(stream, i) {
            var reading = i < streams.length - 1;
            var writing = i > 0;
            return destroyer(stream, reading, writing, function(err) {
                if (!error) error = err;
                if (err) destroys.forEach(call);
                if (reading) return;
                destroys.forEach(call);
                callback(error);
            });
        });
        return streams.reduce(pipe);
    };
    pump_1 = pump;
    return pump_1;
}

var inherits = {
    exports: {}
};

var inherits_browser = {
    exports: {}
};

var hasRequiredInherits_browser;
function requireInherits_browser() {
    if (hasRequiredInherits_browser) return inherits_browser.exports;
    hasRequiredInherits_browser = 1;
    if (typeof Object.create === 'function') {
        // implementation from standard node.js 'util' module
        inherits_browser.exports = function inherits(ctor, superCtor) {
            if (superCtor) {
                ctor.super_ = superCtor;
                ctor.prototype = Object.create(superCtor.prototype, {
                    constructor: {
                        value: ctor,
                        enumerable: false,
                        writable: true,
                        configurable: true
                    }
                });
            }
        };
    } else {
        // old school shim for old browsers
        inherits_browser.exports = function inherits(ctor, superCtor) {
            if (superCtor) {
                ctor.super_ = superCtor;
                var TempCtor = function TempCtor() {};
                TempCtor.prototype = superCtor.prototype;
                ctor.prototype = new TempCtor();
                ctor.prototype.constructor = ctor;
            }
        };
    }
    return inherits_browser.exports;
}

var hasRequiredInherits;
function requireInherits() {
    if (hasRequiredInherits) return inherits.exports;
    hasRequiredInherits = 1;
    try {
        var util = require('util');
        /* istanbul ignore next */ if (typeof util.inherits !== 'function') throw '';
        inherits.exports = util.inherits;
    } catch (e) {
        /* istanbul ignore next */ inherits.exports = requireInherits_browser();
    }
    return inherits.exports;
}

var readable = {
    exports: {}
};

var processNextickArgs = {
    exports: {}
};

var hasRequiredProcessNextickArgs;
function requireProcessNextickArgs() {
    if (hasRequiredProcessNextickArgs) return processNextickArgs.exports;
    hasRequiredProcessNextickArgs = 1;
    if (typeof process === 'undefined' || !process.version || process.version.indexOf('v0.') === 0 || process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {
        processNextickArgs.exports = {
            nextTick: nextTick
        };
    } else {
        processNextickArgs.exports = process;
    }
    function nextTick(fn, arg1, arg2, arg3) {
        if (typeof fn !== 'function') {
            throw new TypeError('"callback" argument must be a function');
        }
        var len = arguments.length;
        var args, i;
        switch(len){
            case 0:
            case 1:
                return process.nextTick(fn);
            case 2:
                return process.nextTick(function afterTickOne() {
                    fn.call(null, arg1);
                });
            case 3:
                return process.nextTick(function afterTickTwo() {
                    fn.call(null, arg1, arg2);
                });
            case 4:
                return process.nextTick(function afterTickThree() {
                    fn.call(null, arg1, arg2, arg3);
                });
            default:
                args = new Array(len - 1);
                i = 0;
                while(i < args.length){
                    args[i++] = arguments[i];
                }
                return process.nextTick(function afterTick() {
                    fn.apply(null, args);
                });
        }
    }
    return processNextickArgs.exports;
}

var isarray;
var hasRequiredIsarray;
function requireIsarray() {
    if (hasRequiredIsarray) return isarray;
    hasRequiredIsarray = 1;
    var toString = {}.toString;
    isarray = Array.isArray || function(arr) {
        return toString.call(arr) == '[object Array]';
    };
    return isarray;
}

var stream;
var hasRequiredStream;
function requireStream() {
    if (hasRequiredStream) return stream;
    hasRequiredStream = 1;
    stream = require$$0;
    return stream;
}

var safeBuffer = {
    exports: {}
};

var hasRequiredSafeBuffer;
function requireSafeBuffer() {
    if (hasRequiredSafeBuffer) return safeBuffer.exports;
    hasRequiredSafeBuffer = 1;
    (function(module, exports) {
        var buffer = require$$0$1;
        var Buffer = buffer.Buffer;
        // alternative to using Object.keys for old browsers
        function copyProps(src, dst) {
            for(var key in src){
                dst[key] = src[key];
            }
        }
        if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
            module.exports = buffer;
        } else {
            // Copy properties from require('buffer')
            copyProps(buffer, exports);
            exports.Buffer = SafeBuffer;
        }
        function SafeBuffer(arg, encodingOrOffset, length) {
            return Buffer(arg, encodingOrOffset, length);
        }
        // Copy static methods from Buffer
        copyProps(Buffer, SafeBuffer);
        SafeBuffer.from = function(arg, encodingOrOffset, length) {
            if (typeof arg === 'number') {
                throw new TypeError('Argument must not be a number');
            }
            return Buffer(arg, encodingOrOffset, length);
        };
        SafeBuffer.alloc = function(size, fill, encoding) {
            if (typeof size !== 'number') {
                throw new TypeError('Argument must be a number');
            }
            var buf = Buffer(size);
            if (fill !== undefined) {
                if (typeof encoding === 'string') {
                    buf.fill(fill, encoding);
                } else {
                    buf.fill(fill);
                }
            } else {
                buf.fill(0);
            }
            return buf;
        };
        SafeBuffer.allocUnsafe = function(size) {
            if (typeof size !== 'number') {
                throw new TypeError('Argument must be a number');
            }
            return Buffer(size);
        };
        SafeBuffer.allocUnsafeSlow = function(size) {
            if (typeof size !== 'number') {
                throw new TypeError('Argument must be a number');
            }
            return buffer.SlowBuffer(size);
        };
    })(safeBuffer, safeBuffer.exports);
    return safeBuffer.exports;
}

var util = {};

function _instanceof$8(left, right) {
    if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
        return !!right[Symbol.hasInstance](left);
    } else {
        return left instanceof right;
    }
}
function _type_of(obj) {
    "@swc/helpers - typeof";
    return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj;
}
var hasRequiredUtil;
function requireUtil() {
    if (hasRequiredUtil) return util;
    hasRequiredUtil = 1;
    // Copyright Joyent, Inc. and other Node contributors.
    //
    // Permission is hereby granted, free of charge, to any person obtaining a
    // copy of this software and associated documentation files (the
    // "Software"), to deal in the Software without restriction, including
    // without limitation the rights to use, copy, modify, merge, publish,
    // distribute, sublicense, and/or sell copies of the Software, and to permit
    // persons to whom the Software is furnished to do so, subject to the
    // following conditions:
    //
    // The above copyright notice and this permission notice shall be included
    // in all copies or substantial portions of the Software.
    //
    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
    // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
    // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
    // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
    // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
    // USE OR OTHER DEALINGS IN THE SOFTWARE.
    // NOTE: These type checking functions intentionally don't use `instanceof`
    // because it is fragile and can be easily faked with `Object.create()`.
    function isArray(arg) {
        if (Array.isArray) {
            return Array.isArray(arg);
        }
        return objectToString(arg) === '[object Array]';
    }
    util.isArray = isArray;
    function isBoolean(arg) {
        return typeof arg === 'boolean';
    }
    util.isBoolean = isBoolean;
    function isNull(arg) {
        return arg === null;
    }
    util.isNull = isNull;
    function isNullOrUndefined(arg) {
        return arg == null;
    }
    util.isNullOrUndefined = isNullOrUndefined;
    function isNumber(arg) {
        return typeof arg === 'number';
    }
    util.isNumber = isNumber;
    function isString(arg) {
        return typeof arg === 'string';
    }
    util.isString = isString;
    function isSymbol(arg) {
        return (typeof arg === "undefined" ? "undefined" : _type_of(arg)) === 'symbol';
    }
    util.isSymbol = isSymbol;
    function isUndefined(arg) {
        return arg === void 0;
    }
    util.isUndefined = isUndefined;
    function isRegExp(re) {
        return objectToString(re) === '[object RegExp]';
    }
    util.isRegExp = isRegExp;
    function isObject(arg) {
        return (typeof arg === "undefined" ? "undefined" : _type_of(arg)) === 'object' && arg !== null;
    }
    util.isObject = isObject;
    function isDate(d) {
        return objectToString(d) === '[object Date]';
    }
    util.isDate = isDate;
    function isError(e) {
        return objectToString(e) === '[object Error]' || _instanceof$8(e, Error);
    }
    util.isError = isError;
    function isFunction(arg) {
        return typeof arg === 'function';
    }
    util.isFunction = isFunction;
    function isPrimitive(arg) {
        return arg === null || typeof arg === 'boolean' || typeof arg === 'number' || typeof arg === 'string' || (typeof arg === "undefined" ? "undefined" : _type_of(arg)) === 'symbol' || // ES6 symbol
        typeof arg === 'undefined';
    }
    util.isPrimitive = isPrimitive;
    util.isBuffer = require$$0$1.Buffer.isBuffer;
    function objectToString(o) {
        return Object.prototype.toString.call(o);
    }
    return util;
}

var BufferList = {
    exports: {}
};

function _instanceof$7(left, right) {
    if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
        return !!right[Symbol.hasInstance](left);
    } else {
        return left instanceof right;
    }
}
var hasRequiredBufferList;
function requireBufferList() {
    if (hasRequiredBufferList) return BufferList.exports;
    hasRequiredBufferList = 1;
    (function(module) {
        function _classCallCheck(instance, Constructor) {
            if (!_instanceof$7(instance, Constructor)) {
                throw new TypeError("Cannot call a class as a function");
            }
        }
        var Buffer = requireSafeBuffer().Buffer;
        var util = require$$1;
        function copyBuffer(src, target, offset) {
            src.copy(target, offset);
        }
        module.exports = function() {
            function BufferList() {
                _classCallCheck(this, BufferList);
                this.head = null;
                this.tail = null;
                this.length = 0;
            }
            BufferList.prototype.push = function push(v) {
                var entry = {
                    data: v,
                    next: null
                };
                if (this.length > 0) this.tail.next = entry;
                else this.head = entry;
                this.tail = entry;
                ++this.length;
            };
            BufferList.prototype.unshift = function unshift(v) {
                var entry = {
                    data: v,
                    next: this.head
                };
                if (this.length === 0) this.tail = entry;
                this.head = entry;
                ++this.length;
            };
            BufferList.prototype.shift = function shift() {
                if (this.length === 0) return;
                var ret = this.head.data;
                if (this.length === 1) this.head = this.tail = null;
                else this.head = this.head.next;
                --this.length;
                return ret;
            };
            BufferList.prototype.clear = function clear() {
                this.head = this.tail = null;
                this.length = 0;
            };
            BufferList.prototype.join = function join(s) {
                if (this.length === 0) return '';
                var p = this.head;
                var ret = '' + p.data;
                while(p = p.next){
                    ret += s + p.data;
                }
                return ret;
            };
            BufferList.prototype.concat = function concat(n) {
                if (this.length === 0) return Buffer.alloc(0);
                var ret = Buffer.allocUnsafe(n >>> 0);
                var p = this.head;
                var i = 0;
                while(p){
                    copyBuffer(p.data, ret, i);
                    i += p.data.length;
                    p = p.next;
                }
                return ret;
            };
            return BufferList;
        }();
        if (util && util.inspect && util.inspect.custom) {
            module.exports.prototype[util.inspect.custom] = function() {
                var obj = util.inspect({
                    length: this.length
                });
                return this.constructor.name + ' ' + obj;
            };
        }
    })(BufferList);
    return BufferList.exports;
}

var destroy_1;
var hasRequiredDestroy;
function requireDestroy() {
    if (hasRequiredDestroy) return destroy_1;
    hasRequiredDestroy = 1;
    /*<replacement>*/ var pna = requireProcessNextickArgs();
    /*</replacement>*/ // undocumented cb() API, needed for core, not for public API
    function destroy(err, cb) {
        var _this = this;
        var readableDestroyed = this._readableState && this._readableState.destroyed;
        var writableDestroyed = this._writableState && this._writableState.destroyed;
        if (readableDestroyed || writableDestroyed) {
            if (cb) {
                cb(err);
            } else if (err) {
                if (!this._writableState) {
                    pna.nextTick(emitErrorNT, this, err);
                } else if (!this._writableState.errorEmitted) {
                    this._writableState.errorEmitted = true;
                    pna.nextTick(emitErrorNT, this, err);
                }
            }
            return this;
        }
        // we set destroyed to true before firing error callbacks in order
        // to make it re-entrance safe in case destroy() is called within callbacks
        if (this._readableState) {
            this._readableState.destroyed = true;
        }
        // if this is a duplex stream mark the writable part as destroyed as well
        if (this._writableState) {
            this._writableState.destroyed = true;
        }
        this._destroy(err || null, function(err) {
            if (!cb && err) {
                if (!_this._writableState) {
                    pna.nextTick(emitErrorNT, _this, err);
                } else if (!_this._writableState.errorEmitted) {
                    _this._writableState.errorEmitted = true;
                    pna.nextTick(emitErrorNT, _this, err);
                }
            } else if (cb) {
                cb(err);
            }
        });
        return this;
    }
    function undestroy() {
        if (this._readableState) {
            this._readableState.destroyed = false;
            this._readableState.reading = false;
            this._readableState.ended = false;
            this._readableState.endEmitted = false;
        }
        if (this._writableState) {
            this._writableState.destroyed = false;
            this._writableState.ended = false;
            this._writableState.ending = false;
            this._writableState.finalCalled = false;
            this._writableState.prefinished = false;
            this._writableState.finished = false;
            this._writableState.errorEmitted = false;
        }
    }
    function emitErrorNT(self, err) {
        self.emit('error', err);
    }
    destroy_1 = {
        destroy: destroy,
        undestroy: undestroy
    };
    return destroy_1;
}

var node;
var hasRequiredNode;
function requireNode() {
    if (hasRequiredNode) return node;
    hasRequiredNode = 1;
    /**
	 * For Node.js, simply re-export the core `util.deprecate` function.
	 */ node = require$$1.deprecate;
    return node;
}

function _instanceof$6(left, right) {
    if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
        return !!right[Symbol.hasInstance](left);
    } else {
        return left instanceof right;
    }
}
var _stream_writable;
var hasRequired_stream_writable;
function require_stream_writable() {
    if (hasRequired_stream_writable) return _stream_writable;
    hasRequired_stream_writable = 1;
    /*<replacement>*/ var pna = requireProcessNextickArgs();
    /*</replacement>*/ _stream_writable = Writable;
    // It seems a linked list but it is not
    // there will be only 2 of these for each stream
    function CorkedRequest(state) {
        var _this = this;
        this.next = null;
        this.entry = null;
        this.finish = function() {
            onCorkedFinish(_this, state);
        };
    }
    /* </replacement> */ /*<replacement>*/ var asyncWrite = !process.browser && [
        'v0.10',
        'v0.9.'
    ].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : pna.nextTick;
    /*</replacement>*/ /*<replacement>*/ var Duplex;
    /*</replacement>*/ Writable.WritableState = WritableState;
    /*<replacement>*/ var util = Object.create(requireUtil());
    util.inherits = requireInherits();
    /*</replacement>*/ /*<replacement>*/ var internalUtil = {
        deprecate: requireNode()
    };
    /*</replacement>*/ /*<replacement>*/ var Stream = requireStream();
    /*</replacement>*/ /*<replacement>*/ var Buffer = requireSafeBuffer().Buffer;
    var OurUint8Array = (typeof commonjsGlobal !== 'undefined' ? commonjsGlobal : typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : {}).Uint8Array || function() {};
    function _uint8ArrayToBuffer(chunk) {
        return Buffer.from(chunk);
    }
    function _isUint8Array(obj) {
        return Buffer.isBuffer(obj) || _instanceof$6(obj, OurUint8Array);
    }
    /*</replacement>*/ var destroyImpl = requireDestroy();
    util.inherits(Writable, Stream);
    function nop() {}
    function WritableState(options, stream) {
        Duplex = Duplex || require_stream_duplex();
        options = options || {};
        // Duplex streams are both readable and writable, but share
        // the same options object.
        // However, some cases require setting options to different
        // values for the readable and the writable sides of the duplex stream.
        // These options can be provided separately as readableXXX and writableXXX.
        var isDuplex = _instanceof$6(stream, Duplex);
        // object stream flag to indicate whether or not this stream
        // contains buffers or objects.
        this.objectMode = !!options.objectMode;
        if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode;
        // the point at which write() starts returning false
        // Note: 0 is a valid value, means that we always return false if
        // the entire buffer is not flushed immediately on write()
        var hwm = options.highWaterMark;
        var writableHwm = options.writableHighWaterMark;
        var defaultHwm = this.objectMode ? 16 : 16 * 1024;
        if (hwm || hwm === 0) this.highWaterMark = hwm;
        else if (isDuplex && (writableHwm || writableHwm === 0)) this.highWaterMark = writableHwm;
        else this.highWaterMark = defaultHwm;
        // cast to ints.
        this.highWaterMark = Math.floor(this.highWaterMark);
        // if _final has been called
        this.finalCalled = false;
        // drain event flag.
        this.needDrain = false;
        // at the start of calling end()
        this.ending = false;
        // when end() has been called, and returned
        this.ended = false;
        // when 'finish' is emitted
        this.finished = false;
        // has it been destroyed
        this.destroyed = false;
        // should we decode strings into buffers before passing to _write?
        // this is here so that some node-core streams can optimize string
        // handling at a lower level.
        var noDecode = options.decodeStrings === false;
        this.decodeStrings = !noDecode;
        // Crypto is kind of old and crusty.  Historically, its default string
        // encoding is 'binary' so we have to make this configurable.
        // Everything else in the universe uses 'utf8', though.
        this.defaultEncoding = options.defaultEncoding || 'utf8';
        // not an actual buffer we keep track of, but a measurement
        // of how much we're waiting to get pushed to some underlying
        // socket or file.
        this.length = 0;
        // a flag to see when we're in the middle of a write.
        this.writing = false;
        // when true all writes will be buffered until .uncork() call
        this.corked = 0;
        // a flag to be able to tell if the onwrite cb is called immediately,
        // or on a later tick.  We set this to true at first, because any
        // actions that shouldn't happen until "later" should generally also
        // not happen before the first write call.
        this.sync = true;
        // a flag to know if we're processing previously buffered items, which
        // may call the _write() callback in the same tick, so that we don't
        // end up in an overlapped onwrite situation.
        this.bufferProcessing = false;
        // the callback that's passed to _write(chunk,cb)
        this.onwrite = function(er) {
            onwrite(stream, er);
        };
        // the callback that the user supplies to write(chunk,encoding,cb)
        this.writecb = null;
        // the amount that is being written when _write is called.
        this.writelen = 0;
        this.bufferedRequest = null;
        this.lastBufferedRequest = null;
        // number of pending user-supplied write callbacks
        // this must be 0 before 'finish' can be emitted
        this.pendingcb = 0;
        // emit prefinish if the only thing we're waiting for is _write cbs
        // This is relevant for synchronous Transform streams
        this.prefinished = false;
        // True if the error was already emitted and should not be thrown again
        this.errorEmitted = false;
        // count buffered requests
        this.bufferedRequestCount = 0;
        // allocate the first CorkedRequest, there is always
        // one allocated and free to use, and we maintain at most two
        this.corkedRequestsFree = new CorkedRequest(this);
    }
    WritableState.prototype.getBuffer = function getBuffer() {
        var current = this.bufferedRequest;
        var out = [];
        while(current){
            out.push(current);
            current = current.next;
        }
        return out;
    };
    (function() {
        try {
            Object.defineProperty(WritableState.prototype, 'buffer', {
                get: internalUtil.deprecate(function() {
                    return this.getBuffer();
                }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.', 'DEP0003')
            });
        } catch (_) {}
    })();
    // Test _writableState for inheritance to account for Duplex streams,
    // whose prototype chain only points to Readable.
    var realHasInstance;
    if (typeof Symbol === 'function' && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === 'function') {
        realHasInstance = Function.prototype[Symbol.hasInstance];
        Object.defineProperty(Writable, Symbol.hasInstance, {
            value: function value(object) {
                if (realHasInstance.call(this, object)) return true;
                if (this !== Writable) return false;
                return object && _instanceof$6(object._writableState, WritableState);
            }
        });
    } else {
        realHasInstance = function realHasInstance(object) {
            return _instanceof$6(object, this);
        };
    }
    function Writable(options) {
        Duplex = Duplex || require_stream_duplex();
        // Writable ctor is applied to Duplexes, too.
        // `realHasInstance` is necessary because using plain `instanceof`
        // would return false, as no `_writableState` property is attached.
        // Trying to use the custom `instanceof` for Writable here will also break the
        // Node.js LazyTransform implementation, which has a non-trivial getter for
        // `_writableState` that would lead to infinite recursion.
        if (!realHasInstance.call(Writable, this) && !_instanceof$6(this, Duplex)) {
            return new Writable(options);
        }
        this._writableState = new WritableState(options, this);
        // legacy.
        this.writable = true;
        if (options) {
            if (typeof options.write === 'function') this._write = options.write;
            if (typeof options.writev === 'function') this._writev = options.writev;
            if (typeof options.destroy === 'function') this._destroy = options.destroy;
            if (typeof options.final === 'function') this._final = options.final;
        }
        Stream.call(this);
    }
    // Otherwise people can pipe Writable streams, which is just wrong.
    Writable.prototype.pipe = function() {
        this.emit('error', new Error('Cannot pipe, not readable'));
    };
    function writeAfterEnd(stream, cb) {
        var er = new Error('write after end');
        // TODO: defer error events consistently everywhere, not just the cb
        stream.emit('error', er);
        pna.nextTick(cb, er);
    }
    // Checks that a user-supplied chunk is valid, especially for the particular
    // mode the stream is in. Currently this means that `null` is never accepted
    // and undefined/non-string values are only allowed in object mode.
    function validChunk(stream, state, chunk, cb) {
        var valid = true;
        var er = false;
        if (chunk === null) {
            er = new TypeError('May not write null values to stream');
        } else if (typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
            er = new TypeError('Invalid non-string/buffer chunk');
        }
        if (er) {
            stream.emit('error', er);
            pna.nextTick(cb, er);
            valid = false;
        }
        return valid;
    }
    Writable.prototype.write = function(chunk, encoding, cb) {
        var state = this._writableState;
        var ret = false;
        var isBuf = !state.objectMode && _isUint8Array(chunk);
        if (isBuf && !Buffer.isBuffer(chunk)) {
            chunk = _uint8ArrayToBuffer(chunk);
        }
        if (typeof encoding === 'function') {
            cb = encoding;
            encoding = null;
        }
        if (isBuf) encoding = 'buffer';
        else if (!encoding) encoding = state.defaultEncoding;
        if (typeof cb !== 'function') cb = nop;
        if (state.ended) writeAfterEnd(this, cb);
        else if (isBuf || validChunk(this, state, chunk, cb)) {
            state.pendingcb++;
            ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
        }
        return ret;
    };
    Writable.prototype.cork = function() {
        var state = this._writableState;
        state.corked++;
    };
    Writable.prototype.uncork = function() {
        var state = this._writableState;
        if (state.corked) {
            state.corked--;
            if (!state.writing && !state.corked && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
        }
    };
    Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
        // node::ParseEncoding() requires lower case.
        if (typeof encoding === 'string') encoding = encoding.toLowerCase();
        if (!([
            'hex',
            'utf8',
            'utf-8',
            'ascii',
            'binary',
            'base64',
            'ucs2',
            'ucs-2',
            'utf16le',
            'utf-16le',
            'raw'
        ].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
        this._writableState.defaultEncoding = encoding;
        return this;
    };
    function decodeChunk(state, chunk, encoding) {
        if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
            chunk = Buffer.from(chunk, encoding);
        }
        return chunk;
    }
    Object.defineProperty(Writable.prototype, 'writableHighWaterMark', {
        // making it explicit this property is not enumerable
        // because otherwise some prototype manipulation in
        // userland will fail
        enumerable: false,
        get: function get() {
            return this._writableState.highWaterMark;
        }
    });
    // if we're already writing something, then just put this
    // in the queue, and wait our turn.  Otherwise, call _write
    // If we return false, then we need a drain event, so set that flag.
    function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
        if (!isBuf) {
            var newChunk = decodeChunk(state, chunk, encoding);
            if (chunk !== newChunk) {
                isBuf = true;
                encoding = 'buffer';
                chunk = newChunk;
            }
        }
        var len = state.objectMode ? 1 : chunk.length;
        state.length += len;
        var ret = state.length < state.highWaterMark;
        // we must ensure that previous needDrain will not be reset to false.
        if (!ret) state.needDrain = true;
        if (state.writing || state.corked) {
            var last = state.lastBufferedRequest;
            state.lastBufferedRequest = {
                chunk: chunk,
                encoding: encoding,
                isBuf: isBuf,
                callback: cb,
                next: null
            };
            if (last) {
                last.next = state.lastBufferedRequest;
            } else {
                state.bufferedRequest = state.lastBufferedRequest;
            }
            state.bufferedRequestCount += 1;
        } else {
            doWrite(stream, state, false, len, chunk, encoding, cb);
        }
        return ret;
    }
    function doWrite(stream, state, writev, len, chunk, encoding, cb) {
        state.writelen = len;
        state.writecb = cb;
        state.writing = true;
        state.sync = true;
        if (writev) stream._writev(chunk, state.onwrite);
        else stream._write(chunk, encoding, state.onwrite);
        state.sync = false;
    }
    function onwriteError(stream, state, sync, er, cb) {
        --state.pendingcb;
        if (sync) {
            // defer the callback if we are being called synchronously
            // to avoid piling up things on the stack
            pna.nextTick(cb, er);
            // this can emit finish, and it will always happen
            // after error
            pna.nextTick(finishMaybe, stream, state);
            stream._writableState.errorEmitted = true;
            stream.emit('error', er);
        } else {
            // the caller expect this to happen before if
            // it is async
            cb(er);
            stream._writableState.errorEmitted = true;
            stream.emit('error', er);
            // this can emit finish, but finish must
            // always follow error
            finishMaybe(stream, state);
        }
    }
    function onwriteStateUpdate(state) {
        state.writing = false;
        state.writecb = null;
        state.length -= state.writelen;
        state.writelen = 0;
    }
    function onwrite(stream, er) {
        var state = stream._writableState;
        var sync = state.sync;
        var cb = state.writecb;
        onwriteStateUpdate(state);
        if (er) onwriteError(stream, state, sync, er, cb);
        else {
            // Check if we're actually ready to finish, but don't emit yet
            var finished = needFinish(state);
            if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
                clearBuffer(stream, state);
            }
            if (sync) {
                /*<replacement>*/ asyncWrite(afterWrite, stream, state, finished, cb);
            /*</replacement>*/ } else {
                afterWrite(stream, state, finished, cb);
            }
        }
    }
    function afterWrite(stream, state, finished, cb) {
        if (!finished) onwriteDrain(stream, state);
        state.pendingcb--;
        cb();
        finishMaybe(stream, state);
    }
    // Must force callback to be called on nextTick, so that we don't
    // emit 'drain' before the write() consumer gets the 'false' return
    // value, and has a chance to attach a 'drain' listener.
    function onwriteDrain(stream, state) {
        if (state.length === 0 && state.needDrain) {
            state.needDrain = false;
            stream.emit('drain');
        }
    }
    // if there's something in the buffer waiting, then process it
    function clearBuffer(stream, state) {
        state.bufferProcessing = true;
        var entry = state.bufferedRequest;
        if (stream._writev && entry && entry.next) {
            // Fast case, write everything using _writev()
            var l = state.bufferedRequestCount;
            var buffer = new Array(l);
            var holder = state.corkedRequestsFree;
            holder.entry = entry;
            var count = 0;
            var allBuffers = true;
            while(entry){
                buffer[count] = entry;
                if (!entry.isBuf) allBuffers = false;
                entry = entry.next;
                count += 1;
            }
            buffer.allBuffers = allBuffers;
            doWrite(stream, state, true, state.length, buffer, '', holder.finish);
            // doWrite is almost always async, defer these to save a bit of time
            // as the hot path ends with doWrite
            state.pendingcb++;
            state.lastBufferedRequest = null;
            if (holder.next) {
                state.corkedRequestsFree = holder.next;
                holder.next = null;
            } else {
                state.corkedRequestsFree = new CorkedRequest(state);
            }
            state.bufferedRequestCount = 0;
        } else {
            // Slow case, write chunks one-by-one
            while(entry){
                var chunk = entry.chunk;
                var encoding = entry.encoding;
                var cb = entry.callback;
                var len = state.objectMode ? 1 : chunk.length;
                doWrite(stream, state, false, len, chunk, encoding, cb);
                entry = entry.next;
                state.bufferedRequestCount--;
                // if we didn't call the onwrite immediately, then
                // it means that we need to wait until it does.
                // also, that means that the chunk and cb are currently
                // being processed, so move the buffer counter past them.
                if (state.writing) {
                    break;
                }
            }
            if (entry === null) state.lastBufferedRequest = null;
        }
        state.bufferedRequest = entry;
        state.bufferProcessing = false;
    }
    Writable.prototype._write = function(chunk, encoding, cb) {
        cb(new Error('_write() is not implemented'));
    };
    Writable.prototype._writev = null;
    Writable.prototype.end = function(chunk, encoding, cb) {
        var state = this._writableState;
        if (typeof chunk === 'function') {
            cb = chunk;
            chunk = null;
            encoding = null;
        } else if (typeof encoding === 'function') {
            cb = encoding;
            encoding = null;
        }
        if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);
        // .end() fully uncorks
        if (state.corked) {
            state.corked = 1;
            this.uncork();
        }
        // ignore unnecessary end() calls.
        if (!state.ending) endWritable(this, state, cb);
    };
    function needFinish(state) {
        return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
    }
    function callFinal(stream, state) {
        stream._final(function(err) {
            state.pendingcb--;
            if (err) {
                stream.emit('error', err);
            }
            state.prefinished = true;
            stream.emit('prefinish');
            finishMaybe(stream, state);
        });
    }
    function prefinish(stream, state) {
        if (!state.prefinished && !state.finalCalled) {
            if (typeof stream._final === 'function') {
                state.pendingcb++;
                state.finalCalled = true;
                pna.nextTick(callFinal, stream, state);
            } else {
                state.prefinished = true;
                stream.emit('prefinish');
            }
        }
    }
    function finishMaybe(stream, state) {
        var need = needFinish(state);
        if (need) {
            prefinish(stream, state);
            if (state.pendingcb === 0) {
                state.finished = true;
                stream.emit('finish');
            }
        }
        return need;
    }
    function endWritable(stream, state, cb) {
        state.ending = true;
        finishMaybe(stream, state);
        if (cb) {
            if (state.finished) pna.nextTick(cb);
            else stream.once('finish', cb);
        }
        state.ended = true;
        stream.writable = false;
    }
    function onCorkedFinish(corkReq, state, err) {
        var entry = corkReq.entry;
        corkReq.entry = null;
        while(entry){
            var cb = entry.callback;
            state.pendingcb--;
            cb(err);
            entry = entry.next;
        }
        // reuse the free corkReq.
        state.corkedRequestsFree.next = corkReq;
    }
    Object.defineProperty(Writable.prototype, 'destroyed', {
        get: function get() {
            if (this._writableState === undefined) {
                return false;
            }
            return this._writableState.destroyed;
        },
        set: function set(value) {
            // we ignore the value if the stream
            // has not been initialized yet
            if (!this._writableState) {
                return;
            }
            // backward compatibility, the user is explicitly
            // managing destroyed
            this._writableState.destroyed = value;
        }
    });
    Writable.prototype.destroy = destroyImpl.destroy;
    Writable.prototype._undestroy = destroyImpl.undestroy;
    Writable.prototype._destroy = function(err, cb) {
        this.end();
        cb(err);
    };
    return _stream_writable;
}

function _instanceof$5(left, right) {
    if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
        return !!right[Symbol.hasInstance](left);
    } else {
        return left instanceof right;
    }
}
var _stream_duplex;
var hasRequired_stream_duplex;
function require_stream_duplex() {
    if (hasRequired_stream_duplex) return _stream_duplex;
    hasRequired_stream_duplex = 1;
    /*<replacement>*/ var pna = requireProcessNextickArgs();
    /*</replacement>*/ /*<replacement>*/ var objectKeys = Object.keys || function(obj) {
        var keys = [];
        for(var key in obj){
            keys.push(key);
        }
        return keys;
    };
    /*</replacement>*/ _stream_duplex = Duplex;
    /*<replacement>*/ var util = Object.create(requireUtil());
    util.inherits = requireInherits();
    /*</replacement>*/ var Readable = require_stream_readable();
    var Writable = require_stream_writable();
    util.inherits(Duplex, Readable);
    {
        // avoid scope creep, the keys array can then be collected
        var keys = objectKeys(Writable.prototype);
        for(var v = 0; v < keys.length; v++){
            var method = keys[v];
            if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
        }
    }
    function Duplex(options) {
        if (!_instanceof$5(this, Duplex)) return new Duplex(options);
        Readable.call(this, options);
        Writable.call(this, options);
        if (options && options.readable === false) this.readable = false;
        if (options && options.writable === false) this.writable = false;
        this.allowHalfOpen = true;
        if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;
        this.once('end', onend);
    }
    Object.defineProperty(Duplex.prototype, 'writableHighWaterMark', {
        // making it explicit this property is not enumerable
        // because otherwise some prototype manipulation in
        // userland will fail
        enumerable: false,
        get: function get() {
            return this._writableState.highWaterMark;
        }
    });
    // the no-half-open enforcer
    function onend() {
        // if we allow half-open state, or if the writable side ended,
        // then we're ok.
        if (this.allowHalfOpen || this._writableState.ended) return;
        // no more data can be written.
        // But allow more writes to happen in this tick.
        pna.nextTick(onEndNT, this);
    }
    function onEndNT(self) {
        self.end();
    }
    Object.defineProperty(Duplex.prototype, 'destroyed', {
        get: function get() {
            if (this._readableState === undefined || this._writableState === undefined) {
                return false;
            }
            return this._readableState.destroyed && this._writableState.destroyed;
        },
        set: function set(value) {
            // we ignore the value if the stream
            // has not been initialized yet
            if (this._readableState === undefined || this._writableState === undefined) {
                return;
            }
            // backward compatibility, the user is explicitly
            // managing destroyed
            this._readableState.destroyed = value;
            this._writableState.destroyed = value;
        }
    });
    Duplex.prototype._destroy = function(err, cb) {
        this.push(null);
        this.end();
        pna.nextTick(cb, err);
    };
    return _stream_duplex;
}

function _instanceof$4(left, right) {
    if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
        return !!right[Symbol.hasInstance](left);
    } else {
        return left instanceof right;
    }
}
var _stream_readable;
var hasRequired_stream_readable;
function require_stream_readable() {
    if (hasRequired_stream_readable) return _stream_readable;
    hasRequired_stream_readable = 1;
    /*<replacement>*/ var pna = requireProcessNextickArgs();
    /*</replacement>*/ _stream_readable = Readable;
    /*<replacement>*/ var isArray = requireIsarray();
    /*</replacement>*/ /*<replacement>*/ var Duplex;
    /*</replacement>*/ Readable.ReadableState = ReadableState;
    /*<replacement>*/ require$$2.EventEmitter;
    var EElistenerCount = function EElistenerCount(emitter, type) {
        return emitter.listeners(type).length;
    };
    /*</replacement>*/ /*<replacement>*/ var Stream = requireStream();
    /*</replacement>*/ /*<replacement>*/ var Buffer = requireSafeBuffer().Buffer;
    var OurUint8Array = (typeof commonjsGlobal !== 'undefined' ? commonjsGlobal : typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : {}).Uint8Array || function() {};
    function _uint8ArrayToBuffer(chunk) {
        return Buffer.from(chunk);
    }
    function _isUint8Array(obj) {
        return Buffer.isBuffer(obj) || _instanceof$4(obj, OurUint8Array);
    }
    /*</replacement>*/ /*<replacement>*/ var util = Object.create(requireUtil());
    util.inherits = requireInherits();
    /*</replacement>*/ /*<replacement>*/ var debugUtil = require$$1;
    var debug = void 0;
    if (debugUtil && debugUtil.debuglog) {
        debug = debugUtil.debuglog('stream');
    } else {
        debug = function debug() {};
    }
    /*</replacement>*/ var BufferList = requireBufferList();
    var destroyImpl = requireDestroy();
    var StringDecoder;
    util.inherits(Readable, Stream);
    var kProxyEvents = [
        'error',
        'close',
        'destroy',
        'pause',
        'resume'
    ];
    function prependListener(emitter, event, fn) {
        // Sadly this is not cacheable as some libraries bundle their own
        // event emitter implementation with them.
        if (typeof emitter.prependListener === 'function') return emitter.prependListener(event, fn);
        // This is a hack to make sure that our error handler is attached before any
        // userland ones.  NEVER DO THIS. This is here only because this code needs
        // to continue to work with older versions of Node.js that do not include
        // the prependListener() method. The goal is to eventually remove this hack.
        if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);
        else if (isArray(emitter._events[event])) emitter._events[event].unshift(fn);
        else emitter._events[event] = [
            fn,
            emitter._events[event]
        ];
    }
    function ReadableState(options, stream) {
        Duplex = Duplex || require_stream_duplex();
        options = options || {};
        // Duplex streams are both readable and writable, but share
        // the same options object.
        // However, some cases require setting options to different
        // values for the readable and the writable sides of the duplex stream.
        // These options can be provided separately as readableXXX and writableXXX.
        var isDuplex = _instanceof$4(stream, Duplex);
        // object stream flag. Used to make read(n) ignore n and to
        // make all the buffer merging and length checks go away
        this.objectMode = !!options.objectMode;
        if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode;
        // the point at which it stops calling _read() to fill the buffer
        // Note: 0 is a valid value, means "don't call _read preemptively ever"
        var hwm = options.highWaterMark;
        var readableHwm = options.readableHighWaterMark;
        var defaultHwm = this.objectMode ? 16 : 16 * 1024;
        if (hwm || hwm === 0) this.highWaterMark = hwm;
        else if (isDuplex && (readableHwm || readableHwm === 0)) this.highWaterMark = readableHwm;
        else this.highWaterMark = defaultHwm;
        // cast to ints.
        this.highWaterMark = Math.floor(this.highWaterMark);
        // A linked list is used to store data chunks instead of an array because the
        // linked list can remove elements from the beginning faster than
        // array.shift()
        this.buffer = new BufferList();
        this.length = 0;
        this.pipes = null;
        this.pipesCount = 0;
        this.flowing = null;
        this.ended = false;
        this.endEmitted = false;
        this.reading = false;
        // a flag to be able to tell if the event 'readable'/'data' is emitted
        // immediately, or on a later tick.  We set this to true at first, because
        // any actions that shouldn't happen until "later" should generally also
        // not happen before the first read call.
        this.sync = true;
        // whenever we return null, then we set a flag to say
        // that we're awaiting a 'readable' event emission.
        this.needReadable = false;
        this.emittedReadable = false;
        this.readableListening = false;
        this.resumeScheduled = false;
        // has it been destroyed
        this.destroyed = false;
        // Crypto is kind of old and crusty.  Historically, its default string
        // encoding is 'binary' so we have to make this configurable.
        // Everything else in the universe uses 'utf8', though.
        this.defaultEncoding = options.defaultEncoding || 'utf8';
        // the number of writers that are awaiting a drain event in .pipe()s
        this.awaitDrain = 0;
        // if true, a maybeReadMore has been scheduled
        this.readingMore = false;
        this.decoder = null;
        this.encoding = null;
        if (options.encoding) {
            if (!StringDecoder) StringDecoder = require$$11.StringDecoder;
            this.decoder = new StringDecoder(options.encoding);
            this.encoding = options.encoding;
        }
    }
    function Readable(options) {
        Duplex = Duplex || require_stream_duplex();
        if (!_instanceof$4(this, Readable)) return new Readable(options);
        this._readableState = new ReadableState(options, this);
        // legacy
        this.readable = true;
        if (options) {
            if (typeof options.read === 'function') this._read = options.read;
            if (typeof options.destroy === 'function') this._destroy = options.destroy;
        }
        Stream.call(this);
    }
    Object.defineProperty(Readable.prototype, 'destroyed', {
        get: function get() {
            if (this._readableState === undefined) {
                return false;
            }
            return this._readableState.destroyed;
        },
        set: function set(value) {
            // we ignore the value if the stream
            // has not been initialized yet
            if (!this._readableState) {
                return;
            }
            // backward compatibility, the user is explicitly
            // managing destroyed
            this._readableState.destroyed = value;
        }
    });
    Readable.prototype.destroy = destroyImpl.destroy;
    Readable.prototype._undestroy = destroyImpl.undestroy;
    Readable.prototype._destroy = function(err, cb) {
        this.push(null);
        cb(err);
    };
    // Manually shove something into the read() buffer.
    // This returns true if the highWaterMark has not been hit yet,
    // similar to how Writable.write() returns true if you should
    // write() some more.
    Readable.prototype.push = function(chunk, encoding) {
        var state = this._readableState;
        var skipChunkCheck;
        if (!state.objectMode) {
            if (typeof chunk === 'string') {
                encoding = encoding || state.defaultEncoding;
                if (encoding !== state.encoding) {
                    chunk = Buffer.from(chunk, encoding);
                    encoding = '';
                }
                skipChunkCheck = true;
            }
        } else {
            skipChunkCheck = true;
        }
        return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
    };
    // Unshift should *always* be something directly out of read()
    Readable.prototype.unshift = function(chunk) {
        return readableAddChunk(this, chunk, null, true, false);
    };
    function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
        var state = stream._readableState;
        if (chunk === null) {
            state.reading = false;
            onEofChunk(stream, state);
        } else {
            var er;
            if (!skipChunkCheck) er = chunkInvalid(state, chunk);
            if (er) {
                stream.emit('error', er);
            } else if (state.objectMode || chunk && chunk.length > 0) {
                if (typeof chunk !== 'string' && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer.prototype) {
                    chunk = _uint8ArrayToBuffer(chunk);
                }
                if (addToFront) {
                    if (state.endEmitted) stream.emit('error', new Error('stream.unshift() after end event'));
                    else addChunk(stream, state, chunk, true);
                } else if (state.ended) {
                    stream.emit('error', new Error('stream.push() after EOF'));
                } else {
                    state.reading = false;
                    if (state.decoder && !encoding) {
                        chunk = state.decoder.write(chunk);
                        if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false);
                        else maybeReadMore(stream, state);
                    } else {
                        addChunk(stream, state, chunk, false);
                    }
                }
            } else if (!addToFront) {
                state.reading = false;
            }
        }
        return needMoreData(state);
    }
    function addChunk(stream, state, chunk, addToFront) {
        if (state.flowing && state.length === 0 && !state.sync) {
            stream.emit('data', chunk);
            stream.read(0);
        } else {
            // update the buffer info.
            state.length += state.objectMode ? 1 : chunk.length;
            if (addToFront) state.buffer.unshift(chunk);
            else state.buffer.push(chunk);
            if (state.needReadable) emitReadable(stream);
        }
        maybeReadMore(stream, state);
    }
    function chunkInvalid(state, chunk) {
        var er;
        if (!_isUint8Array(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
            er = new TypeError('Invalid non-string/buffer chunk');
        }
        return er;
    }
    // if it's past the high water mark, we can push in some more.
    // Also, if we have no data yet, we can stand some
    // more bytes.  This is to work around cases where hwm=0,
    // such as the repl.  Also, if the push() triggered a
    // readable event, and the user called read(largeNumber) such that
    // needReadable was set, then we ought to push more, so that another
    // 'readable' event will be triggered.
    function needMoreData(state) {
        return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
    }
    Readable.prototype.isPaused = function() {
        return this._readableState.flowing === false;
    };
    // backwards compatibility.
    Readable.prototype.setEncoding = function(enc) {
        if (!StringDecoder) StringDecoder = require$$11.StringDecoder;
        this._readableState.decoder = new StringDecoder(enc);
        this._readableState.encoding = enc;
        return this;
    };
    // Don't raise the hwm > 8MB
    var MAX_HWM = 0x800000;
    function computeNewHighWaterMark(n) {
        if (n >= MAX_HWM) {
            n = MAX_HWM;
        } else {
            // Get the next highest power of 2 to prevent increasing hwm excessively in
            // tiny amounts
            n--;
            n |= n >>> 1;
            n |= n >>> 2;
            n |= n >>> 4;
            n |= n >>> 8;
            n |= n >>> 16;
            n++;
        }
        return n;
    }
    // This function is designed to be inlinable, so please take care when making
    // changes to the function body.
    function howMuchToRead(n, state) {
        if (n <= 0 || state.length === 0 && state.ended) return 0;
        if (state.objectMode) return 1;
        if (n !== n) {
            // Only flow one buffer at a time
            if (state.flowing && state.length) return state.buffer.head.data.length;
            else return state.length;
        }
        // If we're asking for more than the current hwm, then raise the hwm.
        if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
        if (n <= state.length) return n;
        // Don't have enough
        if (!state.ended) {
            state.needReadable = true;
            return 0;
        }
        return state.length;
    }
    // you can override either this method, or the async _read(n) below.
    Readable.prototype.read = function(n) {
        debug('read', n);
        n = parseInt(n, 10);
        var state = this._readableState;
        var nOrig = n;
        if (n !== 0) state.emittedReadable = false;
        // if we're doing read(0) to trigger a readable event, but we
        // already have a bunch of data in the buffer, then just trigger
        // the 'readable' event and move on.
        if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
            debug('read: emitReadable', state.length, state.ended);
            if (state.length === 0 && state.ended) endReadable(this);
            else emitReadable(this);
            return null;
        }
        n = howMuchToRead(n, state);
        // if we've ended, and we're now clear, then finish it up.
        if (n === 0 && state.ended) {
            if (state.length === 0) endReadable(this);
            return null;
        }
        // All the actual chunk generation logic needs to be
        // *below* the call to _read.  The reason is that in certain
        // synthetic stream cases, such as passthrough streams, _read
        // may be a completely synchronous operation which may change
        // the state of the read buffer, providing enough data when
        // before there was *not* enough.
        //
        // So, the steps are:
        // 1. Figure out what the state of things will be after we do
        // a read from the buffer.
        //
        // 2. If that resulting state will trigger a _read, then call _read.
        // Note that this may be asynchronous, or synchronous.  Yes, it is
        // deeply ugly to write APIs this way, but that still doesn't mean
        // that the Readable class should behave improperly, as streams are
        // designed to be sync/async agnostic.
        // Take note if the _read call is sync or async (ie, if the read call
        // has returned yet), so that we know whether or not it's safe to emit
        // 'readable' etc.
        //
        // 3. Actually pull the requested chunks out of the buffer and return.
        // if we need a readable event, then we need to do some reading.
        var doRead = state.needReadable;
        debug('need readable', doRead);
        // if we currently have less than the highWaterMark, then also read some
        if (state.length === 0 || state.length - n < state.highWaterMark) {
            doRead = true;
            debug('length less than watermark', doRead);
        }
        // however, if we've ended, then there's no point, and if we're already
        // reading, then it's unnecessary.
        if (state.ended || state.reading) {
            doRead = false;
            debug('reading or ended', doRead);
        } else if (doRead) {
            debug('do read');
            state.reading = true;
            state.sync = true;
            // if the length is currently zero, then we *need* a readable event.
            if (state.length === 0) state.needReadable = true;
            // call internal read method
            this._read(state.highWaterMark);
            state.sync = false;
            // If _read pushed data synchronously, then `reading` will be false,
            // and we need to re-evaluate how much data we can return to the user.
            if (!state.reading) n = howMuchToRead(nOrig, state);
        }
        var ret;
        if (n > 0) ret = fromList(n, state);
        else ret = null;
        if (ret === null) {
            state.needReadable = true;
            n = 0;
        } else {
            state.length -= n;
        }
        if (state.length === 0) {
            // If we have nothing in the buffer, then we want to know
            // as soon as we *do* get something into the buffer.
            if (!state.ended) state.needReadable = true;
            // If we tried to read() past the EOF, then emit end on the next tick.
            if (nOrig !== n && state.ended) endReadable(this);
        }
        if (ret !== null) this.emit('data', ret);
        return ret;
    };
    function onEofChunk(stream, state) {
        if (state.ended) return;
        if (state.decoder) {
            var chunk = state.decoder.end();
            if (chunk && chunk.length) {
                state.buffer.push(chunk);
                state.length += state.objectMode ? 1 : chunk.length;
            }
        }
        state.ended = true;
        // emit 'readable' now to make sure it gets picked up.
        emitReadable(stream);
    }
    // Don't emit readable right away in sync mode, because this can trigger
    // another read() call => stack overflow.  This way, it might trigger
    // a nextTick recursion warning, but that's not so bad.
    function emitReadable(stream) {
        var state = stream._readableState;
        state.needReadable = false;
        if (!state.emittedReadable) {
            debug('emitReadable', state.flowing);
            state.emittedReadable = true;
            if (state.sync) pna.nextTick(emitReadable_, stream);
            else emitReadable_(stream);
        }
    }
    function emitReadable_(stream) {
        debug('emit readable');
        stream.emit('readable');
        flow(stream);
    }
    // at this point, the user has presumably seen the 'readable' event,
    // and called read() to consume some data.  that may have triggered
    // in turn another _read(n) call, in which case reading = true if
    // it's in progress.
    // However, if we're not ended, or reading, and the length < hwm,
    // then go ahead and try to read some more preemptively.
    function maybeReadMore(stream, state) {
        if (!state.readingMore) {
            state.readingMore = true;
            pna.nextTick(maybeReadMore_, stream, state);
        }
    }
    function maybeReadMore_(stream, state) {
        var len = state.length;
        while(!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark){
            debug('maybeReadMore read 0');
            stream.read(0);
            if (len === state.length) break;
            else len = state.length;
        }
        state.readingMore = false;
    }
    // abstract method.  to be overridden in specific implementation classes.
    // call cb(er, data) where data is <= n in length.
    // for virtual (non-string, non-buffer) streams, "length" is somewhat
    // arbitrary, and perhaps not very meaningful.
    Readable.prototype._read = function(n) {
        this.emit('error', new Error('_read() is not implemented'));
    };
    Readable.prototype.pipe = function(dest, pipeOpts) {
        var src = this;
        var state = this._readableState;
        switch(state.pipesCount){
            case 0:
                state.pipes = dest;
                break;
            case 1:
                state.pipes = [
                    state.pipes,
                    dest
                ];
                break;
            default:
                state.pipes.push(dest);
                break;
        }
        state.pipesCount += 1;
        debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);
        var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;
        var endFn = doEnd ? onend : unpipe;
        if (state.endEmitted) pna.nextTick(endFn);
        else src.once('end', endFn);
        dest.on('unpipe', onunpipe);
        function onunpipe(readable, unpipeInfo) {
            debug('onunpipe');
            if (readable === src) {
                if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
                    unpipeInfo.hasUnpiped = true;
                    cleanup();
                }
            }
        }
        function onend() {
            debug('onend');
            dest.end();
        }
        // when the dest drains, it reduces the awaitDrain counter
        // on the source.  This would be more elegant with a .once()
        // handler in flow(), but adding and removing repeatedly is
        // too slow.
        var ondrain = pipeOnDrain(src);
        dest.on('drain', ondrain);
        var cleanedUp = false;
        function cleanup() {
            debug('cleanup');
            // cleanup event handlers once the pipe is broken
            dest.removeListener('close', onclose);
            dest.removeListener('finish', onfinish);
            dest.removeListener('drain', ondrain);
            dest.removeListener('error', onerror);
            dest.removeListener('unpipe', onunpipe);
            src.removeListener('end', onend);
            src.removeListener('end', unpipe);
            src.removeListener('data', ondata);
            cleanedUp = true;
            // if the reader is waiting for a drain event from this
            // specific writer, then it would cause it to never start
            // flowing again.
            // So, if this is awaiting a drain, then we just call it now.
            // If we don't know, then assume that we are waiting for one.
            if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
        }
        // If the user pushes more data while we're writing to dest then we'll end up
        // in ondata again. However, we only want to increase awaitDrain once because
        // dest will only emit one 'drain' event for the multiple writes.
        // => Introduce a guard on increasing awaitDrain.
        var increasedAwaitDrain = false;
        src.on('data', ondata);
        function ondata(chunk) {
            debug('ondata');
            increasedAwaitDrain = false;
            var ret = dest.write(chunk);
            if (false === ret && !increasedAwaitDrain) {
                // If the user unpiped during `dest.write()`, it is possible
                // to get stuck in a permanently paused state if that write
                // also returned false.
                // => Check whether `dest` is still a piping destination.
                if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
                    debug('false write response, pause', state.awaitDrain);
                    state.awaitDrain++;
                    increasedAwaitDrain = true;
                }
                src.pause();
            }
        }
        // if the dest has an error, then stop piping into it.
        // however, don't suppress the throwing behavior for this.
        function onerror(er) {
            debug('onerror', er);
            unpipe();
            dest.removeListener('error', onerror);
            if (EElistenerCount(dest, 'error') === 0) dest.emit('error', er);
        }
        // Make sure our error handler is attached before userland ones.
        prependListener(dest, 'error', onerror);
        // Both close and finish should trigger unpipe, but only once.
        function onclose() {
            dest.removeListener('finish', onfinish);
            unpipe();
        }
        dest.once('close', onclose);
        function onfinish() {
            debug('onfinish');
            dest.removeListener('close', onclose);
            unpipe();
        }
        dest.once('finish', onfinish);
        function unpipe() {
            debug('unpipe');
            src.unpipe(dest);
        }
        // tell the dest that it's being piped to
        dest.emit('pipe', src);
        // start the flow if it hasn't been started already.
        if (!state.flowing) {
            debug('pipe resume');
            src.resume();
        }
        return dest;
    };
    function pipeOnDrain(src) {
        return function() {
            var state = src._readableState;
            debug('pipeOnDrain', state.awaitDrain);
            if (state.awaitDrain) state.awaitDrain--;
            if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
                state.flowing = true;
                flow(src);
            }
        };
    }
    Readable.prototype.unpipe = function(dest) {
        var state = this._readableState;
        var unpipeInfo = {
            hasUnpiped: false
        };
        // if we're not piping anywhere, then do nothing.
        if (state.pipesCount === 0) return this;
        // just one destination.  most common case.
        if (state.pipesCount === 1) {
            // passed in one, but it's not the right one.
            if (dest && dest !== state.pipes) return this;
            if (!dest) dest = state.pipes;
            // got a match.
            state.pipes = null;
            state.pipesCount = 0;
            state.flowing = false;
            if (dest) dest.emit('unpipe', this, unpipeInfo);
            return this;
        }
        // slow case. multiple pipe destinations.
        if (!dest) {
            // remove all.
            var dests = state.pipes;
            var len = state.pipesCount;
            state.pipes = null;
            state.pipesCount = 0;
            state.flowing = false;
            for(var i = 0; i < len; i++){
                dests[i].emit('unpipe', this, {
                    hasUnpiped: false
                });
            }
            return this;
        }
        // try to find the right one.
        var index = indexOf(state.pipes, dest);
        if (index === -1) return this;
        state.pipes.splice(index, 1);
        state.pipesCount -= 1;
        if (state.pipesCount === 1) state.pipes = state.pipes[0];
        dest.emit('unpipe', this, unpipeInfo);
        return this;
    };
    // set up data events if they are asked for
    // Ensure readable listeners eventually get something
    Readable.prototype.on = function(ev, fn) {
        var res = Stream.prototype.on.call(this, ev, fn);
        if (ev === 'data') {
            // Start flowing on next tick if stream isn't explicitly paused
            if (this._readableState.flowing !== false) this.resume();
        } else if (ev === 'readable') {
            var state = this._readableState;
            if (!state.endEmitted && !state.readableListening) {
                state.readableListening = state.needReadable = true;
                state.emittedReadable = false;
                if (!state.reading) {
                    pna.nextTick(nReadingNextTick, this);
                } else if (state.length) {
                    emitReadable(this);
                }
            }
        }
        return res;
    };
    Readable.prototype.addListener = Readable.prototype.on;
    function nReadingNextTick(self1) {
        debug('readable nexttick read 0');
        self1.read(0);
    }
    // pause() and resume() are remnants of the legacy readable stream API
    // If the user uses them, then switch into old mode.
    Readable.prototype.resume = function() {
        var state = this._readableState;
        if (!state.flowing) {
            debug('resume');
            state.flowing = true;
            resume(this, state);
        }
        return this;
    };
    function resume(stream, state) {
        if (!state.resumeScheduled) {
            state.resumeScheduled = true;
            pna.nextTick(resume_, stream, state);
        }
    }
    function resume_(stream, state) {
        if (!state.reading) {
            debug('resume read 0');
            stream.read(0);
        }
        state.resumeScheduled = false;
        state.awaitDrain = 0;
        stream.emit('resume');
        flow(stream);
        if (state.flowing && !state.reading) stream.read(0);
    }
    Readable.prototype.pause = function() {
        debug('call pause flowing=%j', this._readableState.flowing);
        if (false !== this._readableState.flowing) {
            debug('pause');
            this._readableState.flowing = false;
            this.emit('pause');
        }
        return this;
    };
    function flow(stream) {
        var state = stream._readableState;
        debug('flow', state.flowing);
        while(state.flowing && stream.read() !== null){}
    }
    // wrap an old-style stream as the async data source.
    // This is *not* part of the readable stream interface.
    // It is an ugly unfortunate mess of history.
    Readable.prototype.wrap = function(stream) {
        var _this = this;
        var state = this._readableState;
        var paused = false;
        stream.on('end', function() {
            debug('wrapped end');
            if (state.decoder && !state.ended) {
                var chunk = state.decoder.end();
                if (chunk && chunk.length) _this.push(chunk);
            }
            _this.push(null);
        });
        stream.on('data', function(chunk) {
            debug('wrapped data');
            if (state.decoder) chunk = state.decoder.write(chunk);
            // don't skip over falsy values in objectMode
            if (state.objectMode && (chunk === null || chunk === undefined)) return;
            else if (!state.objectMode && (!chunk || !chunk.length)) return;
            var ret = _this.push(chunk);
            if (!ret) {
                paused = true;
                stream.pause();
            }
        });
        // proxy all the other methods.
        // important when wrapping filters and duplexes.
        for(var i in stream){
            if (this[i] === undefined && typeof stream[i] === 'function') {
                this[i] = function(method) {
                    return function() {
                        return stream[method].apply(stream, arguments);
                    };
                }(i);
            }
        }
        // proxy certain important events.
        for(var n = 0; n < kProxyEvents.length; n++){
            stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
        }
        // when we try to consume some more bytes, simply unpause the
        // underlying stream.
        this._read = function(n) {
            debug('wrapped _read', n);
            if (paused) {
                paused = false;
                stream.resume();
            }
        };
        return this;
    };
    Object.defineProperty(Readable.prototype, 'readableHighWaterMark', {
        // making it explicit this property is not enumerable
        // because otherwise some prototype manipulation in
        // userland will fail
        enumerable: false,
        get: function get() {
            return this._readableState.highWaterMark;
        }
    });
    // exposed for testing purposes only.
    Readable._fromList = fromList;
    // Pluck off n bytes from an array of buffers.
    // Length is the combined lengths of all the buffers in the list.
    // This function is designed to be inlinable, so please take care when making
    // changes to the function body.
    function fromList(n, state) {
        // nothing buffered
        if (state.length === 0) return null;
        var ret;
        if (state.objectMode) ret = state.buffer.shift();
        else if (!n || n >= state.length) {
            // read it all, truncate the list
            if (state.decoder) ret = state.buffer.join('');
            else if (state.buffer.length === 1) ret = state.buffer.head.data;
            else ret = state.buffer.concat(state.length);
            state.buffer.clear();
        } else {
            // read part of list
            ret = fromListPartial(n, state.buffer, state.decoder);
        }
        return ret;
    }
    // Extracts only enough buffered data to satisfy the amount requested.
    // This function is designed to be inlinable, so please take care when making
    // changes to the function body.
    function fromListPartial(n, list, hasStrings) {
        var ret;
        if (n < list.head.data.length) {
            // slice is the same for buffers and strings
            ret = list.head.data.slice(0, n);
            list.head.data = list.head.data.slice(n);
        } else if (n === list.head.data.length) {
            // first chunk is a perfect match
            ret = list.shift();
        } else {
            // result spans more than one buffer
            ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
        }
        return ret;
    }
    // Copies a specified amount of characters from the list of buffered data
    // chunks.
    // This function is designed to be inlinable, so please take care when making
    // changes to the function body.
    function copyFromBufferString(n, list) {
        var p = list.head;
        var c = 1;
        var ret = p.data;
        n -= ret.length;
        while(p = p.next){
            var str = p.data;
            var nb = n > str.length ? str.length : n;
            if (nb === str.length) ret += str;
            else ret += str.slice(0, n);
            n -= nb;
            if (n === 0) {
                if (nb === str.length) {
                    ++c;
                    if (p.next) list.head = p.next;
                    else list.head = list.tail = null;
                } else {
                    list.head = p;
                    p.data = str.slice(nb);
                }
                break;
            }
            ++c;
        }
        list.length -= c;
        return ret;
    }
    // Copies a specified amount of bytes from the list of buffered data chunks.
    // This function is designed to be inlinable, so please take care when making
    // changes to the function body.
    function copyFromBuffer(n, list) {
        var ret = Buffer.allocUnsafe(n);
        var p = list.head;
        var c = 1;
        p.data.copy(ret);
        n -= p.data.length;
        while(p = p.next){
            var buf = p.data;
            var nb = n > buf.length ? buf.length : n;
            buf.copy(ret, ret.length - n, 0, nb);
            n -= nb;
            if (n === 0) {
                if (nb === buf.length) {
                    ++c;
                    if (p.next) list.head = p.next;
                    else list.head = list.tail = null;
                } else {
                    list.head = p;
                    p.data = buf.slice(nb);
                }
                break;
            }
            ++c;
        }
        list.length -= c;
        return ret;
    }
    function endReadable(stream) {
        var state = stream._readableState;
        // If we get here before consuming all the bytes, then that is a
        // bug in node.  Should never happen.
        if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');
        if (!state.endEmitted) {
            state.ended = true;
            pna.nextTick(endReadableNT, state, stream);
        }
    }
    function endReadableNT(state, stream) {
        // Check that we didn't get one last unshift.
        if (!state.endEmitted && state.length === 0) {
            state.endEmitted = true;
            stream.readable = false;
            stream.emit('end');
        }
    }
    function indexOf(xs, x) {
        for(var i = 0, l = xs.length; i < l; i++){
            if (xs[i] === x) return i;
        }
        return -1;
    }
    return _stream_readable;
}

function _instanceof$3(left, right) {
    if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
        return !!right[Symbol.hasInstance](left);
    } else {
        return left instanceof right;
    }
}
var _stream_transform;
var hasRequired_stream_transform;
function require_stream_transform() {
    if (hasRequired_stream_transform) return _stream_transform;
    hasRequired_stream_transform = 1;
    _stream_transform = Transform;
    var Duplex = require_stream_duplex();
    /*<replacement>*/ var util = Object.create(requireUtil());
    util.inherits = requireInherits();
    /*</replacement>*/ util.inherits(Transform, Duplex);
    function afterTransform(er, data) {
        var ts = this._transformState;
        ts.transforming = false;
        var cb = ts.writecb;
        if (!cb) {
            return this.emit('error', new Error('write callback called multiple times'));
        }
        ts.writechunk = null;
        ts.writecb = null;
        if (data != null) this.push(data);
        cb(er);
        var rs = this._readableState;
        rs.reading = false;
        if (rs.needReadable || rs.length < rs.highWaterMark) {
            this._read(rs.highWaterMark);
        }
    }
    function Transform(options) {
        if (!_instanceof$3(this, Transform)) return new Transform(options);
        Duplex.call(this, options);
        this._transformState = {
            afterTransform: afterTransform.bind(this),
            needTransform: false,
            transforming: false,
            writecb: null,
            writechunk: null,
            writeencoding: null
        };
        // start out asking for a readable event once data is transformed.
        this._readableState.needReadable = true;
        // we have implemented the _read method, and done the other things
        // that Readable wants before the first _read call, so unset the
        // sync guard flag.
        this._readableState.sync = false;
        if (options) {
            if (typeof options.transform === 'function') this._transform = options.transform;
            if (typeof options.flush === 'function') this._flush = options.flush;
        }
        // When the writable side finishes, then flush out anything remaining.
        this.on('prefinish', prefinish);
    }
    function prefinish() {
        var _this = this;
        if (typeof this._flush === 'function') {
            this._flush(function(er, data) {
                done(_this, er, data);
            });
        } else {
            done(this, null, null);
        }
    }
    Transform.prototype.push = function(chunk, encoding) {
        this._transformState.needTransform = false;
        return Duplex.prototype.push.call(this, chunk, encoding);
    };
    // This is the part where you do stuff!
    // override this function in implementation classes.
    // 'chunk' is an input chunk.
    //
    // Call `push(newChunk)` to pass along transformed output
    // to the readable side.  You may call 'push' zero or more times.
    //
    // Call `cb(err)` when you are done with this chunk.  If you pass
    // an error, then that'll put the hurt on the whole operation.  If you
    // never call cb(), then you'll never get another chunk.
    Transform.prototype._transform = function(chunk, encoding, cb) {
        throw new Error('_transform() is not implemented');
    };
    Transform.prototype._write = function(chunk, encoding, cb) {
        var ts = this._transformState;
        ts.writecb = cb;
        ts.writechunk = chunk;
        ts.writeencoding = encoding;
        if (!ts.transforming) {
            var rs = this._readableState;
            if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
        }
    };
    // Doesn't matter what the args are here.
    // _transform does all the work.
    // That we got here means that the readable side wants more data.
    Transform.prototype._read = function(n) {
        var ts = this._transformState;
        if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
            ts.transforming = true;
            this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
        } else {
            // mark that we need a transform, so that any data that comes in
            // will get processed, now that we've asked for it.
            ts.needTransform = true;
        }
    };
    Transform.prototype._destroy = function(err, cb) {
        var _this2 = this;
        Duplex.prototype._destroy.call(this, err, function(err2) {
            cb(err2);
            _this2.emit('close');
        });
    };
    function done(stream, er, data) {
        if (er) return stream.emit('error', er);
        if (data != null) stream.push(data);
        // if there's nothing in the write buffer, then that means
        // that nothing more will ever be provided
        if (stream._writableState.length) throw new Error('Calling transform done when ws.length != 0');
        if (stream._transformState.transforming) throw new Error('Calling transform done when still transforming');
        return stream.push(null);
    }
    return _stream_transform;
}

function _instanceof$2(left, right) {
    if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
        return !!right[Symbol.hasInstance](left);
    } else {
        return left instanceof right;
    }
}
var _stream_passthrough;
var hasRequired_stream_passthrough;
function require_stream_passthrough() {
    if (hasRequired_stream_passthrough) return _stream_passthrough;
    hasRequired_stream_passthrough = 1;
    _stream_passthrough = PassThrough;
    var Transform = require_stream_transform();
    /*<replacement>*/ var util = Object.create(requireUtil());
    util.inherits = requireInherits();
    /*</replacement>*/ util.inherits(PassThrough, Transform);
    function PassThrough(options) {
        if (!_instanceof$2(this, PassThrough)) return new PassThrough(options);
        Transform.call(this, options);
    }
    PassThrough.prototype._transform = function(chunk, encoding, cb) {
        cb(null, chunk);
    };
    return _stream_passthrough;
}

var hasRequiredReadable;
function requireReadable() {
    if (hasRequiredReadable) return readable.exports;
    hasRequiredReadable = 1;
    (function(module, exports) {
        var Stream = require$$0;
        if (process.env.READABLE_STREAM === 'disable' && Stream) {
            module.exports = Stream;
            exports = module.exports = Stream.Readable;
            exports.Readable = Stream.Readable;
            exports.Writable = Stream.Writable;
            exports.Duplex = Stream.Duplex;
            exports.Transform = Stream.Transform;
            exports.PassThrough = Stream.PassThrough;
            exports.Stream = Stream;
        } else {
            exports = module.exports = require_stream_readable();
            exports.Stream = Stream || exports;
            exports.Readable = exports;
            exports.Writable = require_stream_writable();
            exports.Duplex = require_stream_duplex();
            exports.Transform = require_stream_transform();
            exports.PassThrough = require_stream_passthrough();
        }
    })(readable, readable.exports);
    return readable.exports;
}

var streamShift;
var hasRequiredStreamShift;
function requireStreamShift() {
    if (hasRequiredStreamShift) return streamShift;
    hasRequiredStreamShift = 1;
    streamShift = shift;
    function shift(stream) {
        var rs = stream._readableState;
        if (!rs) return null;
        return rs.objectMode || typeof stream._duplexState === 'number' ? stream.read() : stream.read(getStateLength(rs));
    }
    function getStateLength(state) {
        if (state.buffer.length) {
            var idx = state.bufferIndex || 0;
            // Since node 6.3.0 state.buffer is a BufferList not an array
            if (state.buffer.head) {
                return state.buffer.head.data.length;
            } else if (state.buffer.length - idx > 0 && state.buffer[idx]) {
                return state.buffer[idx].length;
            }
        }
        return state.length;
    }
    return streamShift;
}

function _instanceof$1(left, right) {
    if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
        return !!right[Symbol.hasInstance](left);
    } else {
        return left instanceof right;
    }
}
var duplexify;
var hasRequiredDuplexify;
function requireDuplexify() {
    if (hasRequiredDuplexify) return duplexify;
    hasRequiredDuplexify = 1;
    var stream = requireReadable();
    var eos = requireEndOfStream();
    var inherits = requireInherits();
    var shift = requireStreamShift();
    var SIGNAL_FLUSH = Buffer.from && Buffer.from !== Uint8Array.from ? Buffer.from([
        0
    ]) : new Buffer([
        0
    ]);
    var onuncork = function onuncork(self, fn) {
        if (self._corked) self.once('uncork', fn);
        else fn();
    };
    var autoDestroy = function autoDestroy(self, err) {
        if (self._autoDestroy) self.destroy(err);
    };
    var destroyer = function destroyer(self, end) {
        return function(err) {
            if (err) autoDestroy(self, err.message === 'premature close' ? null : err);
            else if (end && !self._ended) self.end();
        };
    };
    var end = function end(ws, fn) {
        if (!ws) return fn();
        if (ws._writableState && ws._writableState.finished) return fn();
        if (ws._writableState) return ws.end(fn);
        ws.end();
        fn();
    };
    var noop = function noop() {};
    var toStreams2 = function toStreams2(rs) {
        return new stream.Readable({
            objectMode: true,
            highWaterMark: 16
        }).wrap(rs);
    };
    var Duplexify = function Duplexify1(writable, readable, opts) {
        if (!_instanceof$1(this, Duplexify)) return new Duplexify(writable, readable, opts);
        stream.Duplex.call(this, opts);
        this._writable = null;
        this._readable = null;
        this._readable2 = null;
        this._autoDestroy = !opts || opts.autoDestroy !== false;
        this._forwardDestroy = !opts || opts.destroy !== false;
        this._forwardEnd = !opts || opts.end !== false;
        this._corked = 1; // start corked
        this._ondrain = null;
        this._drained = false;
        this._forwarding = false;
        this._unwrite = null;
        this._unread = null;
        this._ended = false;
        this.destroyed = false;
        if (writable) this.setWritable(writable);
        if (readable) this.setReadable(readable);
    };
    inherits(Duplexify, stream.Duplex);
    Duplexify.obj = function(writable, readable, opts) {
        if (!opts) opts = {};
        opts.objectMode = true;
        opts.highWaterMark = 16;
        return new Duplexify(writable, readable, opts);
    };
    Duplexify.prototype.cork = function() {
        if (++this._corked === 1) this.emit('cork');
    };
    Duplexify.prototype.uncork = function() {
        if (this._corked && --this._corked === 0) this.emit('uncork');
    };
    Duplexify.prototype.setWritable = function(writable) {
        if (this._unwrite) this._unwrite();
        if (this.destroyed) {
            if (writable && writable.destroy) writable.destroy();
            return;
        }
        if (writable === null || writable === false) {
            this.end();
            return;
        }
        var self = this;
        var unend = eos(writable, {
            writable: true,
            readable: false
        }, destroyer(this, this._forwardEnd));
        var ondrain = function ondrain() {
            var ondrain = self._ondrain;
            self._ondrain = null;
            if (ondrain) ondrain();
        };
        var clear = function clear() {
            self._writable.removeListener('drain', ondrain);
            unend();
        };
        if (this._unwrite) process.nextTick(ondrain); // force a drain on stream reset to avoid livelocks
        this._writable = writable;
        this._writable.on('drain', ondrain);
        this._unwrite = clear;
        this.uncork(); // always uncork setWritable
    };
    Duplexify.prototype.setReadable = function(readable) {
        if (this._unread) this._unread();
        if (this.destroyed) {
            if (readable && readable.destroy) readable.destroy();
            return;
        }
        if (readable === null || readable === false) {
            this.push(null);
            this.resume();
            return;
        }
        var self = this;
        var unend = eos(readable, {
            writable: false,
            readable: true
        }, destroyer(this));
        var onreadable = function onreadable() {
            self._forward();
        };
        var onend = function onend() {
            self.push(null);
        };
        var clear = function clear() {
            self._readable2.removeListener('readable', onreadable);
            self._readable2.removeListener('end', onend);
            unend();
        };
        this._drained = true;
        this._readable = readable;
        this._readable2 = readable._readableState ? readable : toStreams2(readable);
        this._readable2.on('readable', onreadable);
        this._readable2.on('end', onend);
        this._unread = clear;
        this._forward();
    };
    Duplexify.prototype._read = function() {
        this._drained = true;
        this._forward();
    };
    Duplexify.prototype._forward = function() {
        if (this._forwarding || !this._readable2 || !this._drained) return;
        this._forwarding = true;
        var data;
        while(this._drained && (data = shift(this._readable2)) !== null){
            if (this.destroyed) continue;
            this._drained = this.push(data);
        }
        this._forwarding = false;
    };
    Duplexify.prototype.destroy = function(err, cb) {
        if (!cb) cb = noop;
        if (this.destroyed) return cb(null);
        this.destroyed = true;
        var self = this;
        process.nextTick(function() {
            self._destroy(err);
            cb(null);
        });
    };
    Duplexify.prototype._destroy = function(err) {
        if (err) {
            var ondrain = this._ondrain;
            this._ondrain = null;
            if (ondrain) ondrain(err);
            else this.emit('error', err);
        }
        if (this._forwardDestroy) {
            if (this._readable && this._readable.destroy) this._readable.destroy();
            if (this._writable && this._writable.destroy) this._writable.destroy();
        }
        this.emit('close');
    };
    Duplexify.prototype._write = function(data, enc, cb) {
        if (this.destroyed) return;
        if (this._corked) return onuncork(this, this._write.bind(this, data, enc, cb));
        if (data === SIGNAL_FLUSH) return this._finish(cb);
        if (!this._writable) return cb();
        if (this._writable.write(data) === false) this._ondrain = cb;
        else if (!this.destroyed) cb();
    };
    Duplexify.prototype._finish = function(cb) {
        var self = this;
        this.emit('preend');
        onuncork(this, function() {
            end(self._forwardEnd && self._writable, function() {
                // haxx to not emit prefinish twice
                if (self._writableState.prefinished === false) self._writableState.prefinished = true;
                self.emit('prefinish');
                onuncork(self, cb);
            });
        });
    };
    Duplexify.prototype.end = function(data, enc, cb) {
        if (typeof data === 'function') return this.end(null, null, data);
        if (typeof enc === 'function') return this.end(data, null, enc);
        this._ended = true;
        if (data) this.write(data);
        if (!this._writableState.ending && !this._writableState.destroyed) this.write(SIGNAL_FLUSH);
        return stream.Writable.prototype.end.call(this, cb);
    };
    duplexify = Duplexify;
    return duplexify;
}

function _instanceof(left, right) {
    if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
        return !!right[Symbol.hasInstance](left);
    } else {
        return left instanceof right;
    }
}
var hasRequiredPumpify;
function requirePumpify() {
    if (hasRequiredPumpify) return pumpify.exports;
    hasRequiredPumpify = 1;
    var pump = requirePump();
    var inherits = requireInherits();
    var Duplexify = requireDuplexify();
    var toArray = function toArray(args) {
        if (!args.length) return [];
        return Array.isArray(args[0]) ? args[0] : Array.prototype.slice.call(args);
    };
    var define = function define(opts) {
        var Pumpify = function Pumpify1() {
            var streams = toArray(arguments);
            if (!_instanceof(this, Pumpify)) return new Pumpify(streams);
            Duplexify.call(this, null, null, opts);
            if (streams.length) this.setPipeline(streams);
        };
        inherits(Pumpify, Duplexify);
        Pumpify.prototype.setPipeline = function() {
            var streams = toArray(arguments);
            var self = this;
            var ended = false;
            var w = streams[0];
            var r = streams[streams.length - 1];
            r = r.readable ? r : null;
            w = w.writable ? w : null;
            var onclose = function onclose() {
                streams[0].emit('error', new Error('stream was destroyed'));
            };
            this.on('close', onclose);
            this.on('prefinish', function() {
                if (!ended) self.cork();
            });
            pump(streams, function(err) {
                self.removeListener('close', onclose);
                if (err) return self.destroy(err.message === 'premature close' ? null : err);
                ended = true;
                // pump ends after the last stream is not writable *but*
                // pumpify still forwards the readable part so we need to catch errors
                // still, so reenable autoDestroy in this case
                if (self._autoDestroy === false) self._autoDestroy = true;
                self.uncork();
            });
            if (this.destroyed) return onclose();
            this.setWritable(w);
            this.setReadable(r);
        };
        return Pumpify;
    };
    pumpify.exports = define({
        autoDestroy: false,
        destroy: false
    });
    pumpify.exports.obj = define({
        autoDestroy: false,
        destroy: false,
        objectMode: true,
        highWaterMark: 16
    });
    pumpify.exports.ctor = define;
    return pumpify.exports;
}

var pumpifyExports = requirePumpify();
var index = /*@__PURE__*/ getDefaultExportFromCjs(pumpifyExports);

module.exports = index;
