var assert = require('assert');
var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf');
var mkpath = require('mkpath');
var semver = require('semver');

var extract = require('../..');

var TMP_DIR = path.resolve(path.join(__dirname, '..', '..', '.tmp'));
var TARGET = path.resolve(path.join(TMP_DIR, 'target'));
var DATA_DIR = path.resolve(path.join(__dirname, '..', 'data'));

describe('extract-callback', function () {
  beforeEach(function (callback) {
    rimraf(TMP_DIR, function (err) {
      if (err && err.code !== 'EEXIST') return callback(err);
      mkpath(TMP_DIR, callback);
    });
  });

  describe('happy path', function () {
    it('extract file with progress', function (done) {
      var progressUpdates = [];
      function progress(update) {
        progressUpdates.push(update);
      }

      extract(path.join(DATA_DIR, 'fixture.js'), TARGET, { progress: progress }, function (err) {
        assert.ok(!err);

        fs.readdir(TARGET, function (err, files) {
          assert.ok(!err);
          assert.equal(files.length, 1);
          assert.equal(files[0], 'fixture.js');
          assert.ok(progressUpdates.length > 0);
          done();
        });
      });
    });

    it('extract tar with progress', function (done) {
      var progressUpdates = [];

      function progress(update) {
        progressUpdates.push(update);
      }

      extract(path.join(DATA_DIR, 'fixture.tar'), TARGET, { strip: 1, progress: progress }, function (err) {
        assert.ok(!err);

        fs.readdir(TARGET, function (err, files) {
          assert.ok(!err);
          assert.deepEqual(files.sort(), ['file.txt', 'link']);
          assert.equal(fs.realpathSync(path.join(TARGET, 'link')), path.join(TARGET, 'file.txt'));
          assert.equal(progressUpdates.length, 3);
          done();
        });
      });
    });

    it('extract tar multiple times', function (done) {
      extract(path.join(DATA_DIR, 'fixture.tar'), TARGET, { strip: 1 }, function (err) {
        assert.ok(!err);

        extract(path.join(DATA_DIR, 'fixture.tar'), TARGET, { strip: 1 }, function (err) {
          assert.ok(!err);

          fs.readdir(TARGET, function (err, files) {
            assert.ok(!err);
            assert.deepEqual(files.sort(), ['file.txt', 'link']);
            assert.equal(fs.realpathSync(path.join(TARGET, 'link')), path.join(TARGET, 'file.txt'));
            done();
          });
        });
      });
    });

    it('extract zip with progress', function (done) {
      if (semver.lt(process.versions.node, '0.9.0')) return done(); // yauzl does not read the master record properly on Node 0.8

      var progressUpdates = [];

      function progress(update) {
        progressUpdates.push(update);
      }

      extract(path.join(DATA_DIR, 'fixture.tar'), TARGET, { strip: 1, progress: progress }, function (err) {
        assert.ok(!err);

        fs.readdir(TARGET, function (err, files) {
          assert.ok(!err);
          assert.deepEqual(files.sort(), ['file.txt', 'link']);
          assert.equal(fs.realpathSync(path.join(TARGET, 'link')), path.join(TARGET, 'file.txt'));
          assert.equal(progressUpdates.length, 3);
          done();
        });
      });
    });

    it('extract zip multiple times', function (done) {
      if (semver.lt(process.versions.node, '0.9.0')) return done(); // yauzl does not read the master record properly on Node 0.8

      extract(path.join(DATA_DIR, 'fixture.zip'), TARGET, { strip: 1 }, function (err) {
        assert.ok(!err);

        extract(path.join(DATA_DIR, 'fixture.zip'), TARGET, { strip: 1 }, function (err) {
          assert.ok(!err);

          fs.readdir(TARGET, function (err, files) {
            assert.ok(!err);
            assert.deepEqual(files.sort(), ['file.txt', 'link']);
            assert.equal(fs.realpathSync(path.join(TARGET, 'link')), path.join(TARGET, 'file.txt'));
            done();
          });
        });
      });
    });
  });

  describe('unhappy path', function () {
    it('should fail with too large strip (tar) - path', function (done) {
      extract(path.join(DATA_DIR, 'fixture.tar'), TARGET, { strip: 2 }, function (err) {
        assert.ok(!!err);
        done();
      });
    });

    it('should fail with too large strip (tar) - stream', function (done) {
      extract(fs.createReadStream(path.join(DATA_DIR, 'fixture.tar')), TARGET, { strip: 2 }, function (err) {
        assert.ok(!!err);
        done();
      });
    });

    it('should fail with too large strip (zip) - path', function (done) {
      if (semver.lt(process.versions.node, '0.9.0')) return done(); // yauzl does not read the master record properly on Node 0.8

      extract(path.join(DATA_DIR, 'fixture.zip'), TARGET, { strip: 2 }, function (err) {
        assert.ok(!!err);
        done();
      });
    });

    it('should fail with too large strip (zip) - stream', function (done) {
      if (semver.lt(process.versions.node, '0.9.0')) return done(); // yauzl does not read the master record properly on Node 0.8

      extract(fs.createReadStream(path.join(DATA_DIR, 'fixture.zip')), TARGET, { strip: 2 }, function (err) {
        assert.ok(!!err);
        done();
      });
    });
  });
});
