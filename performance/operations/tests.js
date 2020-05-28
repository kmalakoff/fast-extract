var BenchmarkSuite = require('benchmark-suite');

var MAX_STACK = 1000;

module.exports = async function run({ Queue, version }) {
  var suite = new BenchmarkSuite('queue-cb ' + version, 'Operations');

  function testFn(parallelism) {
    return new Promise(function (resolve, reject) {
      var queue = new Queue(parallelism);

      for (var index = 0; index < MAX_STACK; index++) {
        queue.defer(function (callback) {
          callback();
        });
      }
      queue.await(function (err) {
        err ? reject(err) : resolve();
      });
    });
  }

  suite.add(`parallelism 1`, function (fn) {
    return testFn(1);
  });
  suite.add(`parallelism 100`, function (fn) {
    return testFn(100);
  });
  suite.add(`parallelism Infinity`, function (fn) {
    return testFn(100);
  });

  suite.on('cycle', (results) => {
    for (var key in results) console.log(`${results[key].name.padStart(8, ' ')}| ${suite.formatStats(results[key].stats)} - ${key}`);
  });
  suite.on('complete', function (results) {
    console.log('-----Largest-----');
    for (var key in results) console.log(`${results[key].name.padStart(8, ' ')}| ${suite.formatStats(results[key].stats)} - ${key}`);
  });

  console.log('----------' + suite.name + '----------');
  await suite.run({ time: 1000 });
  console.log('');
};
