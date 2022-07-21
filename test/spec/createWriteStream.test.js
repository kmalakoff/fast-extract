var assert = require('assert');
var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf');
var mkpath = require('mkpath');
var assign = require('just-extend');

var createWriteStream = require('../..').createWriteStream;
var validateFiles = require('../lib/validateFiles');

var constants = require('../lib/constants');
var TMP_DIR = constants.TMP_DIR;
var TARGET = constants.TARGET;
var DATA_DIR = constants.DATA_DIR;

var major = +process.versions.node.split('.')[0];
var minor = +process.versions.node.split('.')[1];

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

      var options = { basename: 'fixture.js', progress: progress };
      var res = fs.createReadStream(path.join(DATA_DIR, 'fixture.js')).pipe(createWriteStream(TARGET, options));
      res.on('error', function (err) {
        assert.ok(!err);
      });
      res.on('finish', function () {
        validateFiles(options, 'js', function (err) {
          assert.ok(!err);
          assert.ok(progressUpdates.length > 0);
          done();
        });
      });
    });

    it('extract file multiple times', function (done) {
      var options = { basename: 'fixture.js' };
      var res = fs.createReadStream(path.join(DATA_DIR, 'fixture.js')).pipe(createWriteStream(TARGET, options));
      res.on('error', function (err) {
        assert.ok(!err);
      });
      res.on('finish', function () {
        validateFiles(options, 'js', function (err) {
          assert.ok(!err);

          var res = fs.createReadStream(path.join(DATA_DIR, 'fixture.js')).pipe(createWriteStream(TARGET, options));
          res.on('error', function (err) {
            assert.ok(err);

            var res = fs.createReadStream(path.join(DATA_DIR, 'fixture.js')).pipe(createWriteStream(TARGET, assign({ force: true }, options)));
            res.on('error', function (err) {
              assert.ok(!err);
            });
            res.on('finish', function () {
              validateFiles(options, 'js', function (err) {
                assert.ok(!err);
                done();
              });
            });
          });
          res.on('finish', function () {});
        });
      });
    });

    it('extract file with progress - no basename', function (done) {
      var progressUpdates = [];
      function progress(update) {
        progressUpdates.push(update);
      }

      var options = { progress: progress };
      var res = fs.createReadStream(path.join(DATA_DIR, 'fixture.js')).pipe(createWriteStream(TARGET, options));
      res.on('error', function (err) {
        assert.ok(!err);
      });
      res.on('finish', function () {
        validateFiles(options, function (err) {
          assert.ok(!err);
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

      var options = { type: 'tar', strip: 1, progress: progress };
      var res = fs.createReadStream(path.join(DATA_DIR, 'fixture.tar')).pipe(createWriteStream(TARGET, options));
      res.on('error', function (err) {
        assert.ok(!err);
      });
      res.on('finish', function () {
        validateFiles(options, 'tar', function (err) {
          assert.ok(!err);
          assert.equal(progressUpdates.length, 16);
          done();
        });
      });
    });

    it('extract tar multiple times', function (done) {
      var options = { type: 'tar', strip: 1 };
      var res = fs.createReadStream(path.join(DATA_DIR, 'fixture.tar')).pipe(createWriteStream(TARGET, options));
      res.on('error', function (err) {
        assert.ok(!err);
      });
      res.on('finish', function () {
        validateFiles(options, 'tar', function (err) {
          assert.ok(!err);

          var res = fs.createReadStream(path.join(DATA_DIR, 'fixture.tar')).pipe(createWriteStream(TARGET, options));
          res.on('error', function (err) {
            assert.ok(err);

            var res = fs.createReadStream(path.join(DATA_DIR, 'fixture.tar')).pipe(createWriteStream(TARGET, assign({ force: true }, options)));
            res.on('error', function (err) {
              assert.ok(!err);
            });
            res.on('finish', function () {
              validateFiles(options, 'tar', function (err) {
                assert.ok(!err);
                done();
              });
            });
          });
          res.on('finish', function () {
            assert.ok(false);
          });
        });
      });
    });

    it('extract zip with progress', function (done) {
      if (major === 0 && minor <= 8) return done(); // TODO: yauzl does not read the master record properly on Node 0.8

      var progressUpdates = [];
      function progress(update) {
        progressUpdates.push(update);
      }

      var options = { type: 'zip', strip: 1, progress: progress };
      var res = fs.createReadStream(path.join(DATA_DIR, 'fixture.zip')).pipe(createWriteStream(TARGET, options));
      res.on('error', function (err) {
        assert.ok(!err);
      });
      res.on('finish', function () {
        validateFiles(options, 'zip', function (err) {
          assert.ok(!err);
          assert.equal(progressUpdates.length, 16);
          done();
        });
      });
    });

    it('extract zip multiple times', function (done) {
      if (major === 0 && minor <= 8) return done(); // TODO: yauzl does not read the master record properly on Node 0.8

      var options = { type: 'zip', strip: 1 };
      var res = fs.createReadStream(path.join(DATA_DIR, 'fixture.zip')).pipe(createWriteStream(TARGET, options));
      res.on('error', function (err) {
        assert.ok(!err);
      });
      res.on('finish', function () {
        validateFiles(options, 'zip', function (err) {
          assert.ok(!err);

          var res = fs.createReadStream(path.join(DATA_DIR, 'fixture.zip')).pipe(createWriteStream(TARGET, options));
          res.on('error', function (err) {
            assert.ok(err);

            var res = fs.createReadStream(path.join(DATA_DIR, 'fixture.zip')).pipe(createWriteStream(TARGET, assign({ force: true }, options)));
            res.on('error', function (err) {
              assert.ok(!err);
            });
            res.on('finish', function () {
              validateFiles(options, 'zip', function (err) {
                assert.ok(!err);
                done();
              });
            });
          });
          res.on('finish', function () {
            assert.ok(false);
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
      if (major === 0 && minor <= 8) return done(); // TODO: yauzl does not read the master record properly on Node 0.8

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
