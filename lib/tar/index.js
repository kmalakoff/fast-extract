var tarStream = require('tar-stream');

var createEntry = require('./createEntry');
var processEntries = require('../processEntries');

module.exports = function extractTar(res, dest, options, callback) {
  var extract = tarStream.extract();
  var onEntry = function (header, stream, entryCallback, callback) {
    var entry = createEntry(header);
    callback(entry, stream, entryCallback);
  };

  processEntries({ extract: extract, onEntry: onEntry, close: 'finish' }, dest, options, callback);
  res = res.pipe(extract);
  res.on('error', callback);
  res.on('close', function () {
    callback();
  });
};
