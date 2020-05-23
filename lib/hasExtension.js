module.exports = function hasExtension(string, extension) {
  var parts = string.split('.');
  for (var index = 0; index < parts.length; index++) {
    if (parts[index] === extension) return true;
  }
  return false;
};
