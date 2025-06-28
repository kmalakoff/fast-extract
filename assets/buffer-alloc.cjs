var bufferFill = require("buffer-fill");
var allocUnsafe = require("buffer-alloc-unsafe");

module.exports = function bufferAllocPolyfill(size, fill, encoding) {
	var buffer = allocUnsafe(size);
	if (size === 0) return buffer;
	if (fill === undefined) return bufferFill(buffer, 0);
	if (typeof encoding !== "string") encoding = undefined;
	return bufferFill(buffer, fill, encoding);
};
