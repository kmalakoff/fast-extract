const tests = require('./tests');

const VERSIONS = require('../VERSIONS');

(async () => {
  for (const options of VERSIONS) {
    await tests(options);
  }
})();
