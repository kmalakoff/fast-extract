var assert = require('assert');
var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp-classic');

var extract = require('../..');

var TMP_DIR = path.resolve(path.join(__dirname, '..', '..', '.tmp'));
var DATA_DIR = path.resolve(path.join(__dirname, '..', 'data'));

describe('api', function () {
  beforeEach(function (done) {
    rimraf(TMP_DIR, function () {
      mkdirp(TMP_DIR, done);
    });
  });

  it('extract file with progress', function (done) {
    var progressUpdates = [];
    function progress(update) {
      progressUpdates.push(update);
    }

    extract(path.join(DATA_DIR, 'fixture.js'), TMP_DIR, { progress: progress }, function (err) {
      assert.ok(!err);

      fs.readdir(TMP_DIR, function (err, files) {
        assert.ok(!err);
        assert.equal(files.length, 1);
        assert.equal(files[0], 'fixture.js');
        assert.ok(progressUpdates.length === 1);
        done();
      });
    });
  });

  it('extract tar with progress', function (done) {
    var progressUpdates = [];

    function progress(update) {
      progressUpdates.push(update);
    }

    extract(path.join(DATA_DIR, 'fixture.tar'), TMP_DIR, { strip: 1, progress: progress }, function (err) {
      assert.ok(!err);

      fs.readdir(TMP_DIR, function (err, files) {
        assert.ok(!err);
        assert.deepEqual(files.sort(), ['file.txt', 'link']);
        assert.equal(fs.realpathSync(path.join(TMP_DIR, 'link')), path.join(TMP_DIR, 'file.txt'));
        assert.ok(progressUpdates.length === 3);
        done();
      });
    });
  });
});
