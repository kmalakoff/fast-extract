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
var EXTRACT_TYPES = ['tar', 'tar.bz2', 'tar.gz', 'tgz', 'js'];

if (semver.gte(process.versions.node, '0.9.0')) EXTRACT_TYPES.push('zip'); // yauzl does not read the master record properly on Node 0.8

// lzma-native module compatiblity starts at Node 6
if (semver.gte(process.versions.node, '6.0.0')) {
  try {
    var lzmaNative = require('require_optional')('lzma-native');
    if (lzmaNative) EXTRACT_TYPES.push('tar.xz');
  } catch (err) {}
}

function validateFiles(files, extractType) {
  if (extractType === 'js') {
    assert.equal(files.length, 1);
    assert.ok(~['fixture.js', 'fixture-js'].indexOf(files[0]));
  } else {
    assert.deepEqual(files.sort(), ['file.txt', 'link']);
    assert.equal(fs.realpathSync(path.join(TARGET, 'link')), path.join(TARGET, 'file.txt'));
  }
}

function addTests(extractType) {
  describe(extractType, function () {
    it('extract file', function (done) {
      extract(path.join(DATA_DIR, 'fixture.' + extractType), TARGET, { strip: 1 }, function (err) {
        assert.ok(!err);

        fs.readdir(TARGET, function (err, files) {
          assert.ok(!err);
          validateFiles(files, extractType);
          done();
        });
      });
    });

    it('extract file without type - dot', function (done) {
      extract(path.join(DATA_DIR, 'fixture-' + extractType), TARGET, { strip: 1, type: '.' + extractType }, function (err) {
        assert.ok(!err);

        fs.readdir(TARGET, function (err, files) {
          assert.ok(!err);
          validateFiles(files, extractType);
          done();
        });
      });
    });

    it('extract file without type - no dot', function (done) {
      extract(path.join(DATA_DIR, 'fixture-' + extractType), TARGET, { strip: 1, type: extractType }, function (err) {
        assert.ok(!err);

        fs.readdir(TARGET, function (err, files) {
          assert.ok(!err);
          validateFiles(files, extractType);
          done();
        });
      });
    });

    it('extract file by stream - filename', function (done) {
      var stream = fs.createReadStream(path.join(DATA_DIR, 'fixture-' + extractType));
      stream.filename = 'fixture.' + extractType;
      extract(stream, TARGET, { strip: 1 }, function (err) {
        assert.ok(!err);

        fs.readdir(TARGET, function (err, files) {
          assert.ok(!err);
          validateFiles(files, extractType);
          done();
        });
      });
    });

    it('extract file by stream - basename', function (done) {
      var stream = fs.createReadStream(path.join(DATA_DIR, 'fixture-' + extractType));
      stream.basename = 'fixture.' + extractType;
      extract(stream, TARGET, { strip: 1 }, function (err) {
        assert.ok(!err);

        fs.readdir(TARGET, function (err, files) {
          assert.ok(!err);
          validateFiles(files, extractType);
          done();
        });
      });
    });
  });
}

describe('extensions', function () {
  beforeEach(function (callback) {
    rimraf(TMP_DIR, function (err) {
      if (err && err.code !== 'EEXIST') return callback(err);
      mkpath(TMP_DIR, callback);
    });
  });

  for (var index = 0; index < EXTRACT_TYPES.length; index++) addTests(EXTRACT_TYPES[index]);
});
