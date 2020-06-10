var path = require('path');
var contentDisposition = require('content-disposition');

// eslint-disable-next-line no-control-regex
var POSIX = /[<>:"\\/\\|?*\x00-\x1F]/g;
var WINDOWS = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;

module.exports = function getBasename(source, options, endpoint) {
  // options
  var basename = options.basename || options.filename;
  if (basename !== undefined) return basename;

  // path
  if (typeof source === 'string') return path.basename(source);
  // stream
  else if (source) {
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
};
