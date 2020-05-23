var assert = require('assert');
var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp-classic');
var semver = require('semver');

var extract = require('../..');

var EXTRACT_TYPES = ['tar', 'tar.bz2', 'tar.gz', 'tar.xz', 'tgz', 'zip'];
var TMP_DIR = path.resolve(path.join(__dirname, '..', '..', '.tmp'));
var DATA_DIR = path.resolve(path.join(__dirname, '..', 'data'));

function addTests(extractType) {
  it('extract file (' + extractType + ')', function (done) {
    extract(path.join(DATA_DIR, 'fixture.' + extractType), TMP_DIR, { strip: 1 }, function (err) {
      assert.ok(!err);

      fs.readdir(TMP_DIR, function (err, files) {
        assert.ok(!err);
        assert.deepEqual(files.sort(), ['file.txt', 'link']);
        assert.equal(fs.realpathSync(path.join(TMP_DIR, 'link')), path.join(TMP_DIR, 'file.txt'));
        done();
      });
    });
  });

  it('extract file without extension (' + extractType + ')', function (done) {
    extract(path.join(DATA_DIR, 'fixture-' + extractType), TMP_DIR, { strip: 1, extension: '.' + extractType }, function (err) {
      assert.ok(!err);

      fs.readdir(TMP_DIR, function (err, files) {
        assert.ok(!err);
        assert.deepEqual(files.sort(), ['file.txt', 'link']);
        assert.equal(fs.realpathSync(path.join(TMP_DIR, 'link')), path.join(TMP_DIR, 'file.txt'));
        done();
      });
    });
  });
}

describe('extract', function () {
  beforeEach(function (done) {
    rimraf(TMP_DIR, function () {
      mkdirp(TMP_DIR, done);
    });
  });

  for (var index = 0; index < EXTRACT_TYPES.length; index++) addTests(EXTRACT_TYPES[index]);
});
