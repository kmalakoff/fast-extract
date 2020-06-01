var tarStream = require('tar-stream');

var assign = require('object-assign');
var Queue = require('queue-cb');
var once = require('once');
var throttle = require('lodash.throttle');

var createDirectory = require('../extract/createDirectory');
var createFile = require('../extract/createFile');
var createLink = require('../extract/createLink');
var createEntry = require('./createEntry');

module.exports = function extractTar(res, dest, options, callback) {
  var extract = tarStream.extract();
  callback = once(callback);

  var done = false;
  var links = [];
  options = assign({ now: new Date() }, options);

  var progress = null;
  if (options.progress) {
    progress = function (entry) {
      if (done) return; // throttle can call after done
      entry.progress = 'extract';
      options.progress(entry);
    };
    if (options.time) progress = throttle(progress, options.time, { leading: true });
  }

  extract.on('entry', function (header, stream, callback) {
    createEntry(header, dest, extract, options, function (err, entry) {
      if (err) return callback(err);
      !progress || progress(entry);

      if (entry.type === 'directory') createDirectory(entry, options, callback);
      else if (entry.type === 'symlink' || entry.type === 'link') {
        links.push(entry);
        callback();
      } else if (entry.type === 'file') createFile(entry, stream, options, callback);
      else callback();
    });
  });

  extract.on('finish', function () {
    done = true;
    var queue = new Queue();
    for (var index = 0; index < links.length; index++) queue.defer(createLink.bind(null, links[index], options));
    queue.await(callback);
  });
  extract.on('error', callback);

  res = res.pipe(extract);
  res.on('error', callback);
  res.on('close', function () {
    callback();
  });
};
