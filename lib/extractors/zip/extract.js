var yauzl = require('yauzl');
var once = require('once');
var assign = require('object-assign');
var eos = require('end-of-stream');

var createEntry = require('./createEntry');
var extractProgress = require('../../progress/extractProgress');
var LinksEntry = require('../../entry/Links');

module.exports = function extract(src, dest, options, callback) {
  yauzl.open(src, { lazyEntries: true }, function (err, extract) {
    if (err) return callback(err);

    callback = once(callback);
    options = assign({ now: new Date() }, options, { progress: extractProgress(options) });
    var links = new LinksEntry();

    extract.on('entry', function (header) {
      function callback(err) {
        if (err) {
          extract.emit('error', err);
          return extract.close();
        }
        extract.readEntry();
      }

      createEntry(header, extract, function (err, entry) {
        if (err) return callback(err);

        if (entry.type === 'link' || entry.type === 'symlink') {
          links.push(entry);
          return callback();
        }
        entry.create(dest, options, callback);
      });
    });

    eos(extract, function (err) {
      if (err) {
        options.progress(null); // progress is done
        return callback(err);
      }
      links.create(dest, options, function (err) {
        options.progress(null); // progress is done
        return callback(err);
      });
    });
    extract.readEntry();
  });
};
