var extract = require('./extract');

module.exports = function extractTar(res, dest, options, callback) {
  extract(res, dest, options, callback);
};
