var requireOptional = require('require_optional');

module.exports = function optionalRequire(name) {
  try {
    var mod = require(name);
    if (mod) return mod;
  } catch (err) {}

  try {
    // eslint-disable-next-line no-redeclare
    var mod = requireOptional(name);
    if (mod) return mod;
  } catch (err) {}
  return null;
};
