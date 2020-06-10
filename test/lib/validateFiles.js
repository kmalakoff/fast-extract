var assert = require('assert');
var fs = require('fs');
var path = require('path');
var cr = require('cr');

var TMP_DIR = path.resolve(path.join(__dirname, '..', '..', '.tmp'));
var TARGET = path.resolve(path.join(TMP_DIR, 'target'));
var DATA_DIR = path.resolve(path.join(__dirname, '..', 'data'));

function compareFiles(leftPath, rightPath) {
  var leftContents = fs.readFileSync(leftPath).toString();
  var rightContents = fs.readFileSync(rightPath).toString();
  assert.equal(cr(leftContents), cr(rightContents));
}

module.exports = function validateFiles(files, extractType) {
  if (extractType === undefined) {
    assert.equal(files.length, 1);
    assert.deepEqual(files.sort(), ['target']);
    compareFiles(path.join(TMP_DIR, files[0]), path.join(DATA_DIR, 'fixture.js'));
  } else if (extractType === 'js') {
    assert.equal(files.length, 1);
    assert.ok(~['fixture.js', 'fixture-js'].indexOf(files[0]));
    compareFiles(path.join(TARGET, files[0]), path.join(DATA_DIR, 'fixture.js'));
  } else if (extractType === 'js.gz') {
    assert.equal(files.length, 1);
    assert.ok(~['fixture.js.gz', 'fixture-js.gz'].indexOf(files[0]));
    compareFiles(path.join(TARGET, files[0]), path.join(DATA_DIR, 'fixture.js'));
  } else {
    assert.deepEqual(files.sort(), ['fixture.js', 'link']);
    assert.equal(fs.realpathSync(path.join(TARGET, 'link')), path.join(TARGET, 'fixture.js'));
    compareFiles(path.join(TARGET, files[0]), path.join(DATA_DIR, 'fixture.js'));
    compareFiles(path.join(TARGET, files[1]), path.join(DATA_DIR, 'fixture.js'));
  }
};
