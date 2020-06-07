var tarStream = require('tar-stream');
var once = require('once');
var assign = require('object-assign');
var eos = require('end-of-stream');

var createEntry = require('./createEntry');
var extractProgress = require('../../progress/extractProgress');
var LinksEntry = require('../../entry/Links');

module.exports = function extractTar(src, dest, options, callback) {
  var extract = tarStream.extract();

  callback = once(callback);
  options = assign({ now: new Date() }, options, { progress: extractProgress(options) });
  var links = new LinksEntry();

  extract.on('entry', function (header, stream, callback) {
    var _callback = callback;
    callback = function (err) {
      _callback(err);
    };

    createEntry(header, stream, function (err, entry) {
      if (err) return callback(err);

      if (entry.type === 'link' || entry.type === 'symlink') {
        links.push(entry);
        return callback();
      }
      entry.create(dest, options, callback);
    });
  });

  src = src.pipe(extract);
  eos(src, function (err) {
    if (err) {
      options.progress(null); // progress is done
      return callback(err);
    }
    links.create(dest, options, function (err) {
      options.progress(null); // progress is done
      return callback(err);
    });
  });
};
