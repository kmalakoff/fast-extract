var path = require('path');
var fs = require('fs');
var contentDisposition = require('content-disposition');

// eslint-disable-next-line no-control-regex
var POSIX = /[<>:"\\/\\|?*\x00-\x1F]/g;
var WINDOWS = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;

function getBasename(source, options, endpoint) {
  // options
  var basename = options.basename || options.filename;
  if (basename !== undefined) return basename;

  // path
  if (typeof source === 'string') return path.basename(source);
  // stream
  else {
    if (source.headers && source.headers['content-disposition']) {
      var information = contentDisposition.parse(source.headers['content-disposition']);
      return information.parameters.filename;
    }
    basename = source.basename || source.filename;
    if (basename !== undefined) return basename;
  }

  // endpoint
  if (endpoint) {
    basename = path.basename(endpoint.split('?')[0]);
    basename = basename.replace(POSIX, '!');
    basename = basename.replace(WINDOWS, '!');
    return basename;
  }
}

function getSize(source, options) {
  // options
  var size = options.size;
  if (size !== undefined) return size;

  // path
  if (typeof source === 'string') {
    try {
      var stats = fs.statSync(source);
      return stats.size;
    } catch (err) {}
  }
  // stream
  else {
    if (source.headers && source.headers['content-length']) return source.headers['content-length'];
    size = source.size;
    if (size !== undefined) return size;
  }
}

module.exports = function sourceStats(source, options, endpoint) {
  var stats = {};
  var basename = getBasename(source, options, endpoint);
  var size = getSize(source, options, endpoint);

  if (basename !== undefined) stats.basename = basename;
  if (size !== undefined) stats.size = size;
  return stats;
};
