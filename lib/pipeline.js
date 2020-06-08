var pumpify = require('pumpify');
var PassThrough = require('stream').PassThrough || require('readable-stream').PassThrough;

module.exports = function pipeline(transforms) {
  if (!transforms.length) return new PassThrough();
  return transforms.lengths > 1 ? pumpify(transforms) : transforms[0];
};
