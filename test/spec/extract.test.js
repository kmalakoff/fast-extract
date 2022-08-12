var assert = require('assert');
var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf');
var mkpath = require('mkpath');

var extract = require('../..');
var validateFiles = require('../lib/validateFiles');

var constants = require('../lib/constants');
var TMP_DIR = constants.TMP_DIR;
var TARGET = constants.TARGET;
var DATA_DIR = constants.DATA_DIR;

describe('extract', function () {
  beforeEach(function (callback) {
    rimraf(TMP_DIR, function () {
      mkpath(TMP_DIR, callback);
    });
  });

  describe('happy path', function () {
    it('extract file with progress', function (done) {
      var progressUpdates = [];
      function progress(update) {
        progressUpdates.push(update);
      }

      var options = { progress: progress };
      extract(path.join(DATA_DIR, 'fixture.js'), TARGET, options, function (err) {
        assert.ok(!err);

        validateFiles(options, 'js', function (err) {
          assert.ok(!err);
          assert.ok(progressUpdates.length > 0);
          done();
        });
      });
    });

    it('extract file multiple times', function (done) {
      var options = {};
      extract(path.join(DATA_DIR, 'fixture.js'), TARGET, options, function (err) {
        assert.ok(!err);

        validateFiles(options, 'js', function (err) {
          assert.ok(!err);

          extract(path.join(DATA_DIR, 'fixture.js'), TARGET, options, function (err) {
            assert.ok(err);

            extract(path.join(DATA_DIR, 'fixture.js'), TARGET, Object.assign({ force: true }, options), function (err) {
              assert.ok(!err);

              validateFiles(options, 'js', function (err) {
                assert.ok(!err);
                done();
              });
            });
          });
        });
      });
    });

    it('extract file with progress - promise', function (done) {
      if (typeof Promise === 'undefined') return done();

      var progressUpdates = [];
      function progress(update) {
        progressUpdates.push(update);
      }

      var options = { progress: progress };
      extract(path.join(DATA_DIR, 'fixture.js'), TARGET, options)
        .then(function () {
          validateFiles(options, 'js', function (err) {
            assert.ok(!err);
            assert.ok(progressUpdates.length > 0);
            done();
          });
        })
        .catch(done);
    });

    it('extract tar with progress', function (done) {
      var progressUpdates = [];
      function progress(update) {
        progressUpdates.push(update);
      }

      var options = { strip: 1, progress: progress };
      extract(path.join(DATA_DIR, 'fixture.tar'), TARGET, options, function (err) {
        assert.ok(!err);

        validateFiles(options, 'tar', function (err) {
          assert.ok(!err);
          assert.equal(progressUpdates.length, 16);
          done();
        });
      });
    });

    it('extract tar multiple times', function (done) {
      var options = { strip: 1 };
      extract(path.join(DATA_DIR, 'fixture.tar'), TARGET, options, function (err) {
        assert.ok(!err);

        validateFiles(options, 'tar', function (err) {
          assert.ok(!err);

          extract(path.join(DATA_DIR, 'fixture.tar'), TARGET, options, function (err) {
            assert.ok(err);

            extract(path.join(DATA_DIR, 'fixture.tar'), TARGET, Object.assign({ force: true }, options), function (err) {
              assert.ok(!err);

              validateFiles(options, 'tar', function (err) {
                assert.ok(!err);
                done();
              });
            });
          });
        });
      });
    });

    it('extract zip with progress', function (done) {
      var progressUpdates = [];
      function progress(update) {
        progressUpdates.push(update);
      }

      var options = { strip: 1, progress: progress };
      extract(path.join(DATA_DIR, 'fixture.zip'), TARGET, options, function (err) {
        assert.ok(!err);

        validateFiles(options, 'zip', function (err) {
          assert.ok(!err);
          assert.equal(progressUpdates.length, 16);
          done();
        });
      });
    });

    it('extract zip multiple times', function (done) {
      var options = { strip: 1 };
      extract(path.join(DATA_DIR, 'fixture.zip'), TARGET, options, function (err) {
        assert.ok(!err);

        validateFiles(options, 'zip', function (err) {
          assert.ok(!err);

          extract(path.join(DATA_DIR, 'fixture.zip'), TARGET, options, function (err) {
            assert.ok(err);

            extract(path.join(DATA_DIR, 'fixture.zip'), TARGET, Object.assign({ force: true }, options), function (err) {
              assert.ok(!err);

              validateFiles(options, 'zip', function (err) {
                assert.ok(!err);
                done();
              });
            });
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

    it('should fail with too large strip (tar) - path - promise', function (done) {
      if (typeof Promise === 'undefined') return done();

      extract(path.join(DATA_DIR, 'fixture.tar'), TARGET, { strip: 2 })
        .then(function () {
          assert.ok(false);
        })
        .catch(function (err) {
          assert.ok(!!err);
          done();
        });
    });

    it('should fail with too large strip (tar) - stream', function (done) {
      extract(fs.createReadStream(path.join(DATA_DIR, 'fixture.tar')), TARGET, { type: 'tar', strip: 2 }, function (err) {
        assert.ok(!!err);
        done();
      });
    });

    it('should fail with too large strip (zip) - path', function (done) {
      extract(path.join(DATA_DIR, 'fixture.zip'), TARGET, { strip: 2 }, function (err) {
        assert.ok(!!err);
        done();
      });
    });

    it('should fail with too large strip (zip) - stream', function (done) {
      extract(fs.createReadStream(path.join(DATA_DIR, 'fixture.zip')), TARGET, { type: 'zip', strip: 2 }, function (err) {
        assert.ok(!!err);
        done();
      });
    });
  });
});
