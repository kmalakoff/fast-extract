var assert = require('assert');
var fs = require('fs');
var path = require('path');
var cr = require('cr');

var TMP_DIR = path.resolve(path.join(__dirname, '..', '..', '.tmp'));
var TARGET = path.resolve(path.join(TMP_DIR, 'target'));
var DATA_DIR = path.resolve(path.join(__dirname, '..', 'data'));

var fixtureContexts = cr(fs.readFileSync(path.join(DATA_DIR, 'fixture.js')).toString());

module.exports = function validateFiles(options, _type, done) {
  if (typeof _type === 'function') {
    done = _type;
    _type = undefined;
  }
  if (typeof options === 'string') options = { type: options };
  var type = options.type || _type;
  if (type === undefined) {
    var dataPath = TMP_DIR;
    fs.readdir(dataPath, function (err, files) {
      assert.ok(!err);
      assert.equal(files.length, 1);
      assert.deepEqual(files.sort(), ['target']);
      assert.equal(cr(fs.readFileSync(path.join(dataPath, files[0])).toString()), fixtureContexts);
      done();
    });
  } else if (type === 'js' || type === '.js') {
    // eslint-disable-next-line no-redeclare
    var dataPath = TARGET;
    fs.readdir(dataPath, function (err, files) {
      assert.ok(!err);
      assert.equal(files.length, 1);
      assert.ok(~['fixture.js', 'fixture-js'].indexOf(files[0]));
      assert.equal(cr(fs.readFileSync(path.join(dataPath, files[0])).toString()), fixtureContexts);
      done();
    });
  } else if (type === 'js.gz' || type === '.js.gz') {
    // eslint-disable-next-line no-redeclare
    var dataPath = TARGET;
    fs.readdir(dataPath, function (err, files) {
      assert.ok(!err);
      assert.equal(files.length, 1);
      assert.ok(~['fixture.js.gz', 'fixture-js.gz'].indexOf(files[0]));
      assert.equal(cr(fs.readFileSync(path.join(dataPath, files[0])).toString()), fixtureContexts);
      done();
    });
  } else {
    // eslint-disable-next-line no-redeclare
    var dataPath = !options.strip ? path.join(TARGET, 'data') : TARGET;
    fs.readdir(dataPath, function (err, files) {
      assert.ok(!err);
      assert.deepEqual(files.sort(), ['fixture.js', 'link']);
      assert.equal(fs.realpathSync(path.join(dataPath, 'link')), path.join(dataPath, 'fixture.js'));
      assert.equal(cr(fs.readFileSync(path.join(dataPath, files[0])).toString()), fixtureContexts);
      assert.equal(cr(fs.readFileSync(path.join(dataPath, files[1])).toString()), fixtureContexts);
      done();
    });
  }
};
