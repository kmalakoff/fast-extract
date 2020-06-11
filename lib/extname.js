var path = require('path');

module.exports = function extname(fullPath) {
  var basename = path.basename(fullPath);
  var index = basename.indexOf('.');
  return ~index ? basename.slice(index) : '';
};
