const path = require('path');

module.exports = function extname(fullPath) {
  const basename = path.basename(fullPath);
  const index = basename.indexOf('.');
  return ~index ? basename.slice(index) : '';
};
