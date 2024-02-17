const requireOptional = require('require_optional');

module.exports = function optionalRequire(name) {
  try {
    const mod = require(name);
    if (mod) return mod;
  } catch (_err) {}

  try {
    const mod2 = requireOptional(name);
    if (mod2) return mod2;
  } catch (_err) {}
  return null;
};
