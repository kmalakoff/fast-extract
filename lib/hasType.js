module.exports = function hasType(string, type) {
  var parts = string.split('.');
  for (var index = 0; index < parts.length; index++) {
    if (parts[index] === type) return true;
  }
  return false;
};
