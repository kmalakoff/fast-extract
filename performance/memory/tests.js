var path = require('path');
var fs = require('graceful-fs');
var rimraf = require('rimraf');
var BenchmarkSuite = require('benchmark-suite');

var TMP_DIR = path.resolve(path.join(__dirname, '..', '..', '.tmp'));
var DATA_DIR = path.resolve(path.join(__dirname, '..', '..', 'test', 'data'));

module.exports = async function run({ extract, version }) {
  var suite = new BenchmarkSuite('extract ' + version, 'Memory');

  function testFn(type, highWaterMark, fn) {
    return new Promise(function (resolve, reject) {
      var filename = 'fixture' + highWaterMark + type;
      extract(path.join(DATA_DIR, 'fixture' + type), TMP_DIR, { filename: filename, highWaterMark: highWaterMark, progress: fn, time: 1000 }, function (err) {
        err ? reject(err) : resolve();
      });
    });
  }

  suite.add(`.tar.gz highWaterMark undefined`, function (fn) {
    return testFn('.tar.gz', undefined, fn);
  });
  suite.add(`.tar.gz highWaterMark 1024`, function (fn) {
    return testFn('.tar.gz', 1024, fn);
  });
  suite.add(`.zip highWaterMark undefined`, function (fn) {
    return testFn('.zip', undefined, fn);
  });
  suite.add(`.zip highWaterMark 1024`, function (fn) {
    return testFn('.zip', 1024, fn);
  });

  suite.on('cycle', (results) => {
    for (var key in results) console.log(`${results[key].name.padStart(8, ' ')}| ${suite.formatStats(results[key].stats)} - ${key}`);
  });
  suite.on('complete', function (results) {
    console.log('-----Largest-----');
    for (var key in results) console.log(`${results[key].name.padStart(8, ' ')}| ${suite.formatStats(results[key].stats)} - ${key}`);
  });

  console.log('----------' + suite.name + '----------');
  try {
    rimraf.sync(TMP_DIR);
    fs.mkdirSync(TMP_DIR);
  } catch (err) { }
  await suite.run({ time: 1000 });
  console.log('');
};
