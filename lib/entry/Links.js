var path = require('path');
var compact = require('lodash.compact');

var Queue = require('queue-cb');

var CONCURRENCY = 10;

function LinksEntry() {
  this.links = [];
}

LinksEntry.prototype.push = function push(link) {
  this.links.push(link);
};

LinksEntry.prototype.create = function create(dest, options, callback) {
  var queue = new Queue(CONCURRENCY);
  for (var index = 0; index < this.links.length; index++) {
    (function (entry) {
      queue.defer(function (callback) {
        entry.create(dest, options, function (err) {
          callback(err);
        });
      });
    })(this.links[index]);
  }
  queue.await(callback);
};

module.exports = LinksEntry;
