var assert = require('assert');
var fs = require('graceful-fs');
var path = require('path');
var cr = require('cr');
var Iterator = require('fs-iterator');
var statsSpys = require('fs-stats-spys');

var constants = require('./constants');
var TMP_DIR = constants.TMP_DIR;
var TARGET = constants.TARGET;
var CONTENTS = constants.CONTENTS;

module.exports = function validateFiles(options, _type, callback) {
  if (typeof _type === 'function') {
    callback = _type;
    _type = undefined;
  }

  if (typeof callback === 'function') {
    if (typeof options === 'string') options = { type: options };
    var type = options.type || _type;

    if (type === undefined) {
      var dataPath = TMP_DIR;
      fs.readdir(dataPath, function (err, files) {
        assert.ok(!err);
        assert.equal(files.length, 1);
        assert.deepEqual(files.sort(), ['target']);
        assert.equal(cr(fs.readFileSync(path.join(dataPath, files[0])).toString()), CONTENTS);
        callback();
      });
    } else if (type === 'js' || type === '.js') {
      // eslint-disable-next-line no-redeclare
      var dataPath = TARGET;
      fs.readdir(dataPath, function (err, files) {
        assert.ok(!err);
        assert.equal(files.length, 1);
        assert.ok(~['fixture.js', 'fixture-js'].indexOf(files[0]));
        assert.equal(cr(fs.readFileSync(path.join(dataPath, files[0])).toString()), CONTENTS);
        callback();
      });
    } else if (type === 'js.gz' || type === '.js.gz') {
      // eslint-disable-next-line no-redeclare
      var dataPath = TARGET;
      fs.readdir(dataPath, function (err, files) {
        assert.ok(!err);
        assert.equal(files.length, 1);
        assert.ok(~['fixture.js.gz', 'fixture-js.gz'].indexOf(files[0]));
        assert.equal(cr(fs.readFileSync(path.join(dataPath, files[0])).toString()), CONTENTS);
        callback();
      });
    } else {
      // eslint-disable-next-line no-redeclare
      var dataPath = !options.strip ? path.join(TARGET, 'data') : TARGET;
      var spys = statsSpys();
      new Iterator(dataPath, { lstat: true }).forEach(
        function (entry) {
          spys(entry.stats);
          if (entry.stats.isFile()) {
            assert.equal(cr(fs.readFileSync(entry.fullPath).toString()), CONTENTS);
          } else if (entry.stats.isSymbolicLink()) {
            assert.equal(cr(fs.readFileSync(fs.realpathSync(entry.fullPath)).toString()), CONTENTS);
          }
        },
        function (err) {
          assert.ok(!err);
          assert.equal(spys.dir.callCount, 3);
          assert.equal(spys.file.callCount, 7);
          assert.equal(spys.link.callCount, 5);
          callback();
        }
      );
    }
  } else {
    return new Promise(function validatePromise(resolve, reject) {
      validateFiles(options, _type, function validateCallback(err) {
        err ? reject(err) : resolve();
      });
    });
  }
};
