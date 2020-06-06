var assert = require('assert');
var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf');
var mkpath = require('mkpath');
var semver = require('semver');

var extract = require('../..');

var TMP_DIR = path.resolve(path.join(__dirname, '..', '..', '.tmp'));
var DATA_DIR = path.resolve(path.join(__dirname, '..', 'data'));

describe('api', function () {
  beforeEach(function (done) {
    rimraf(TMP_DIR, function () {
      mkpath(TMP_DIR, done);
    });
  });

  describe('happy path', function () {
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

    it('extract tar multiple times', function (done) {
      extract(path.join(DATA_DIR, 'fixture.tar'), TMP_DIR, { strip: 1 }, function (err) {
        assert.ok(!err);

        extract(path.join(DATA_DIR, 'fixture.tar'), TMP_DIR, { strip: 1 }, function (err) {
          assert.ok(!err);

          fs.readdir(TMP_DIR, function (err, files) {
            assert.ok(!err);
            assert.deepEqual(files.sort(), ['file.txt', 'link']);
            assert.equal(fs.realpathSync(path.join(TMP_DIR, 'link')), path.join(TMP_DIR, 'file.txt'));
            done();
          });
        });
      });
    });

    it('extract zip with progress', function (done) {
      if (semver.lt(process.versions.node, '0.9.0')) return done();

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

    it('extract zip multiple times', function (done) {
      if (semver.lt(process.versions.node, '0.9.0')) return done();

      extract(path.join(DATA_DIR, 'fixture.tar'), TMP_DIR, { strip: 1 }, function (err) {
        assert.ok(!err);

        extract(path.join(DATA_DIR, 'fixture.tar'), TMP_DIR, { strip: 1 }, function (err) {
          assert.ok(!err);

          fs.readdir(TMP_DIR, function (err, files) {
            assert.ok(!err);
            assert.deepEqual(files.sort(), ['file.txt', 'link']);
            assert.equal(fs.realpathSync(path.join(TMP_DIR, 'link')), path.join(TMP_DIR, 'file.txt'));
            done();
          });
        });
      });
    });
  });

  describe('unhappy path', function () {
    it('should fail with too large strip (tar)', function (done) {
      extract(path.join(DATA_DIR, 'fixture.tar'), TMP_DIR, { strip: 2 }, function (err) {
        assert.ok(err);
        done();
      });
    });

    it('should fail with too large strip (zip)', function (done) {
      extract(path.join(DATA_DIR, 'fixture.zip'), TMP_DIR, { strip: 2 }, function (err) {
        assert.ok(err);
        done();
      });
    });
  });
});
