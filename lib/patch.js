// Legacy support
if (typeof Buffer.from === 'undefined')
  Buffer.from = function (data) {
    // eslint-disable-next-line node/no-deprecated-api
    return new Buffer(data);
  };

// TODO: use a compat module rather than mocking
var mock = require('mock-require-lazy');
mock('readable-stream', require('readable-stream'));
mock('bl', require('bl'));
