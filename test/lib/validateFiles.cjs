const assert = require('assert');
const fs = require('fs');
const path = require('path');
const cr = require('cr');
const Iterator = require('fs-iterator');
const statsSpys = require('fs-stats-spys');

const constants = require('./constants.cjs');
const TMP_DIR = constants.TMP_DIR;
const TARGET = constants.TARGET;
const CONTENTS = constants.CONTENTS;

module.exports = function validateFiles(options, _type, callback) {
  if (typeof _type === 'function') {
    callback = _type;
    _type = undefined;
  }

  if (typeof callback === 'function') {
    if (typeof options === 'string') options = { type: options };
    const type = options.type || _type;

    if (type === undefined) {
      const dataPath = TMP_DIR;
      fs.readdir(dataPath, (err, files) => {
        if (err) return done(err.message);
        assert.equal(files.length, 1);
        assert.deepEqual(files.sort(), ['target']);
        assert.equal(cr(fs.readFileSync(path.join(dataPath, files[0])).toString()), CONTENTS);
        callback();
      });
    } else if (type === 'js' || type === '.js') {
      const dataPath = TARGET;
      fs.readdir(dataPath, (err, files) => {
        if (err) return done(err.message);
        assert.equal(files.length, 1);
        assert.ok(~['fixture.js', 'fixture-js'].indexOf(files[0]));
        assert.equal(cr(fs.readFileSync(path.join(dataPath, files[0])).toString()), CONTENTS);
        callback();
      });
    } else if (type === 'js.gz' || type === '.js.gz') {
      const dataPath = TARGET;
      fs.readdir(dataPath, (err, files) => {
        if (err) return done(err.message);
        assert.equal(files.length, 1);
        assert.ok(~['fixture.js.gz', 'fixture-js.gz'].indexOf(files[0]));
        assert.equal(cr(fs.readFileSync(path.join(dataPath, files[0])).toString()), CONTENTS);
        callback();
      });
    } else {
      const dataPath = !options.strip ? path.join(TARGET, 'data') : TARGET;
      const spys = statsSpys();
      new Iterator(dataPath, { lstat: true }).forEach(
        (entry) => {
          spys(entry.stats);
          if (entry.stats.isFile()) {
            assert.equal(cr(fs.readFileSync(entry.fullPath).toString()), CONTENTS);
          } else if (entry.stats.isSymbolicLink()) {
            assert.equal(cr(fs.readFileSync(fs.realpathSync(entry.fullPath)).toString()), CONTENTS);
          }
        },
        (err) => {
          if (err) return done(err.message);
          assert.equal(spys.dir.callCount, 3);
          assert.equal(spys.file.callCount, 7);
          assert.equal(spys.link.callCount, 5);
          callback();
        }
      );
    }
  } else {
    return new Promise(function validatePromise(resolve, reject) {
      validateFiles(options, _type, (err) => (err ? reject(err) : resolve(undefined)));
    });
  }
};
