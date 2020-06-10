var assert = require('assert');
var fs = require('fs');
var path = require('path');

var TMP_DIR = path.resolve(path.join(__dirname, '..', '..', '.tmp'));
var TARGET = path.resolve(path.join(TMP_DIR, 'target'));
var DATA_DIR = path.resolve(path.join(__dirname, '..', 'data'));

module.exports = function validateFiles(files, extractType) {
  if (extractType === undefined) {
    assert.equal(files.length, 1);
    assert.deepEqual(files.sort(), ['target']);
    assert.equal(fs.readFileSync(path.join(TMP_DIR, files[0]), { encoding: 'utf8' }), fs.readFileSync(path.join(DATA_DIR, 'fixture.js'), { encoding: 'utf8' }));
  } else if (extractType === 'js') {
    assert.equal(files.length, 1);
    assert.ok(~['fixture.js', 'fixture-js'].indexOf(files[0]));
    assert.equal(fs.readFileSync(path.join(TARGET, files[0]), { encoding: 'utf8' }), fs.readFileSync(path.join(DATA_DIR, 'fixture.js'), { encoding: 'utf8' }));
  } else if (extractType === 'js.gz') {
    assert.equal(files.length, 1);
    assert.ok(~['fixture.js.gz', 'fixture-js.gz'].indexOf(files[0]));
    assert.equal(fs.readFileSync(path.join(TARGET, files[0]), { encoding: 'utf8' }), fs.readFileSync(path.join(DATA_DIR, 'fixture.js'), { encoding: 'utf8' }));
  } else {
    assert.deepEqual(files.sort(), ['fixture.js', 'link']);
    assert.equal(fs.realpathSync(path.join(TARGET, 'link')), path.join(TARGET, 'fixture.js'));
    assert.equal(fs.readFileSync(path.join(TARGET, files[0]), { encoding: 'utf8' }), fs.readFileSync(path.join(DATA_DIR, 'fixture.js'), { encoding: 'utf8' }));
    assert.equal(fs.readFileSync(path.join(TARGET, files[1]), { encoding: 'utf8' }), fs.readFileSync(path.join(DATA_DIR, 'fixture.js'), { encoding: 'utf8' }));
  }
};
