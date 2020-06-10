var assert = require('assert');
var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf');
var mkpath = require('mkpath');
var semver = require('semver');

var createWriteStream = require('../..').createWriteStream;

var TMP_DIR = path.resolve(path.join(__dirname, '..', '..', '.tmp'));
var TARGET = path.resolve(path.join(TMP_DIR, 'target'));
var DATA_DIR = path.resolve(path.join(__dirname, '..', 'data'));

describe('createWriteStream', function () {
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

      var res = fs.createReadStream(path.join(DATA_DIR, 'fixture.js')).pipe(createWriteStream(TARGET, { basename: 'fixture.js', progress: progress }));
      res.on('error', function (err) {
        assert.ok(!err);
      });
      res.on('finish', function () {
        fs.readdir(TARGET, function (err, files) {
          assert.ok(!err);
          assert.equal(files.length, 1);
          assert.equal(files[0], 'fixture.js');
          assert.ok(progressUpdates.length > 0);
          done();
        });
      });
    });

    it('extract file with progress - no basename', function (done) {
      var progressUpdates = [];
      function progress(update) {
        progressUpdates.push(update);
      }

      var res = fs.createReadStream(path.join(DATA_DIR, 'fixture.js')).pipe(createWriteStream(TARGET, { progress: progress }));
      res.on('error', function (err) {
        assert.ok(!err);
      });
      res.on('finish', function () {
        fs.readdir(TMP_DIR, function (err, files) {
          assert.ok(!err);
          assert.equal(files.length, 1);
          assert.equal(files[0], 'target');
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

      var res = fs.createReadStream(path.join(DATA_DIR, 'fixture.tar')).pipe(createWriteStream(TARGET, { type: 'tar', strip: 1, progress: progress }));
      res.on('error', function (err) {
        assert.ok(!err);
      });
      res.on('finish', function () {
        fs.readdir(TARGET, function (err, files) {
          assert.ok(!err);
          assert.deepEqual(files.sort(), ['fixture.js', 'link']);
          assert.equal(fs.realpathSync(path.join(TARGET, 'link')), path.join(TARGET, 'fixture.js'));
          assert.equal(progressUpdates.length, 3);
          done();
        });
      });
    });

    it('extract tar multiple times', function (done) {
      var res = fs.createReadStream(path.join(DATA_DIR, 'fixture.tar')).pipe(createWriteStream(TARGET, { type: 'tar', strip: 1 }));
      res.on('error', function (err) {
        assert.ok(!err);
      });
      res.on('finish', function () {
        var res = fs.createReadStream(path.join(DATA_DIR, 'fixture.tar')).pipe(createWriteStream(TARGET, { type: 'tar', strip: 1 }));
        res.on('error', function (err) {
          assert.ok(!err);
        });
        res.on('finish', function () {
          fs.readdir(TARGET, function (err, files) {
            assert.ok(!err);
            assert.deepEqual(files.sort(), ['fixture.js', 'link']);
            assert.equal(fs.realpathSync(path.join(TARGET, 'link')), path.join(TARGET, 'fixture.js'));
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

      var res = fs.createReadStream(path.join(DATA_DIR, 'fixture.zip')).pipe(createWriteStream(TARGET, { type: 'zip', strip: 1, progress: progress }));
      res.on('error', function (err) {
        assert.ok(!err);
      });
      res.on('finish', function () {
        fs.readdir(TARGET, function (err, files) {
          assert.ok(!err);
          assert.deepEqual(files.sort(), ['fixture.js', 'link']);
          assert.equal(fs.realpathSync(path.join(TARGET, 'link')), path.join(TARGET, 'fixture.js'));
          assert.equal(progressUpdates.length, 3);
          done();
        });
      });
    });

    it('extract zip multiple times', function (done) {
      if (semver.lt(process.versions.node, '0.9.0')) return done(); // yauzl does not read the master record properly on Node 0.8

      var res = fs.createReadStream(path.join(DATA_DIR, 'fixture.zip')).pipe(createWriteStream(TARGET, { type: 'zip', strip: 1 }));
      res.on('error', function (err) {
        assert.ok(!err);
      });
      res.on('finish', function () {
        var res = fs.createReadStream(path.join(DATA_DIR, 'fixture.zip')).pipe(createWriteStream(TARGET, { type: 'zip', strip: 1 }));
        res.on('error', function (err) {
          assert.ok(!err);
        });
        res.on('finish', function () {
          fs.readdir(TARGET, function (err, files) {
            assert.ok(!err);
            assert.deepEqual(files.sort(), ['fixture.js', 'link']);
            assert.equal(fs.realpathSync(path.join(TARGET, 'link')), path.join(TARGET, 'fixture.js'));
            done();
          });
        });
      });
    });
  });

  describe('unhappy path', function () {
    it('should fail with too large strip (tar)', function (done) {
      var res = fs.createReadStream(path.join(DATA_DIR, 'fixture.tar')).pipe(createWriteStream(TARGET, { type: 'tar', strip: 2 }));
      res.on('error', function (err) {
        assert.ok(!!err);
        done();
      });
      res.on('finish', function () {
        assert.ok(false);
      });
    });

    it('should fail with too large strip (zip)', function (done) {
      if (semver.lt(process.versions.node, '0.9.0')) return done(); // yauzl does not read the master record properly on Node 0.8

      var res = fs.createReadStream(path.join(DATA_DIR, 'fixture.zip')).pipe(createWriteStream(TARGET, { type: 'zip', strip: 2 }));
      res.on('error', function (err) {
        assert.ok(!!err);
        done();
      });
      res.on('finish', function () {
        assert.ok(false);
      });
    });
  });
});
