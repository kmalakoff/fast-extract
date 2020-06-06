var inherits = require('inherits');
var path = require('path');
var fs = require('fs');
var mkpath = require('mkpath');
var pumpify = require('pumpify');
var eos = require('end-of-stream');

var BaseEntry = require('./Base');
var stripPath = require('../stripPath');

function FileEntry(header, stream) {
  BaseEntry.call(this, header);
  this.stream = stream;
}

inherits(FileEntry, BaseEntry);

FileEntry.prototype.create = function create(dest, options, callback) {
  try {
    var self = this;
    var fullPath = path.join(dest, stripPath(this.path, options));
    mkpath(path.dirname(fullPath), function (err) {
      if (err && err.code !== 'EEXIST') return callback(err);

      var res = pumpify(self.stream, fs.createWriteStream(fullPath));
      eos(res, function (err) {
        if (!fs.existsSync(fullPath)) {
          // debugger;
          console.log(new Error('test').stack, 'err', err);
        }
        err ? callback(err) : self.setAttributes(fullPath, options, callback);
      });
    });
  } catch (err) {
    return callback(err);
  }
};

module.exports = FileEntry;
