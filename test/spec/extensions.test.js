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

var EXTRACT_TYPES = ['tar', 'tar.bz2', 'tar.gz', 'tgz', 'js.gz', 'js', 'zip'];

// lzma-native module compatiblity starts at Node 6
var major = +process.versions.node.split('.')[0];
if (major >= 10) {
  try {
    var lzmaNative = require('require_optional')('lzma-native');
    if (lzmaNative) EXTRACT_TYPES.push('tar.xz');
  } catch (err) {}
}

EXTRACT_TYPES = ['tar'];

function addTests(type) {
  describe(type, function () {
    it('extract file', function (done) {
      var options = { strip: 1 };
      extract(path.join(DATA_DIR, 'fixture.' + type), TARGET, options, function (err) {
        assert.ok(!err);

        validateFiles(options, type, function (err) {
          assert.ok(!err);
          done();
        });
      });
    });

    it('extract file without type - dot', function (done) {
      var options = { strip: 1, type: '.' + type };
      extract(path.join(DATA_DIR, 'fixture-' + type), TARGET, options, function (err) {
        assert.ok(!err);

        validateFiles(options, type, function (err) {
          assert.ok(!err);
          done();
        });
      });
    });

    it('extract file without type - no dot', function (done) {
      var options = { strip: 1, type: type };
      extract(path.join(DATA_DIR, 'fixture-' + type), TARGET, options, function (err) {
        assert.ok(!err);

        validateFiles(options, type, function (err) {
          assert.ok(!err);
          done();
        });
      });
    });

    it('extract file without type - options as type, no strip', function (done) {
      var options = type;
      extract(path.join(DATA_DIR, 'fixture-' + type), TARGET, options, function (err) {
        assert.ok(!err);

        validateFiles(options, type, function (err) {
          assert.ok(!err);
          done();
        });
      });
    });

    it('extract file by stream - filename', function (done) {
      var options = { strip: 1 };
      var stream = fs.createReadStream(path.join(DATA_DIR, 'fixture-' + type));
      stream.filename = 'fixture.' + type;
      extract(stream, TARGET, options, function (err) {
        assert.ok(!err);

        validateFiles(options, type, function (err) {
          assert.ok(!err);
          done();
        });
      });
    });

    it('extract file by stream - basename', function (done) {
      var options = { strip: 1 };
      var stream = fs.createReadStream(path.join(DATA_DIR, 'fixture-' + type));
      stream.basename = 'fixture.' + type;
      extract(stream, TARGET, options, function (err) {
        assert.ok(!err);

        validateFiles(options, type, function (err) {
          assert.ok(!err);
          done();
        });
      });
    });
  });
}

describe('extensions', function () {
  beforeEach(function (callback) {
    rimraf(TMP_DIR, function () {
      mkpath(TMP_DIR, callback);
    });
  });

  for (var index = 0; index < EXTRACT_TYPES.length; index++) addTests(EXTRACT_TYPES[index]);
});
