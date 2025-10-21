import extract from 'fast-extract';
import fs from 'fs';
import mkdirp from 'mkdirp-classic';
import path from 'path';
import rimraf2 from 'rimraf2';
import { DATA_DIR, TARGET, TMP_DIR } from '../lib/constants.ts';
import validateFiles from '../lib/validateFiles.ts';

const EXTRACT_TYPES = ['tar', 'tar.bz2', 'tar.gz', 'tgz', 'js.gz', 'js', 'zip'];

interface SpecifiedStream {
  filename?: string;
  basename?: string;
}

// TODO: add 7z
// const EXTRACT_TYPES = ['7z'];

// lzma-native module compatiblity starts at Node 6
const major = +process.versions.node.split('.')[0];
if (major >= 10) {
  try {
    const lzmaNative = require('require_optional')('lzma-native');
    if (lzmaNative) EXTRACT_TYPES.push('tar.xz');
  } catch (_err) {}
}

function addTests(type) {
  describe(type, () => {
    it('extract file', (done) => {
      const options = { strip: 1 };
      extract(path.join(DATA_DIR, `fixture.${type}`), TARGET, options, (err) => {
        if (err) {
          done(err.message);
          return;
        }

        validateFiles(options, type, (err) => {
          if (err) {
            done(err.message);
            return;
          }
          done();
        });
      });
    });

    it('extract file without type - dot', (done) => {
      const options = { strip: 1, type: `.${type}` };
      extract(path.join(DATA_DIR, `fixture-${type}`), TARGET, options, (err) => {
        if (err) {
          done(err.message);
          return;
        }

        validateFiles(options, type, (err) => {
          if (err) {
            done(err.message);
            return;
          }
          done();
        });
      });
    });

    it('extract file without type - no dot', (done) => {
      const options = { strip: 1, type: type };
      extract(path.join(DATA_DIR, `fixture-${type}`), TARGET, options, (err) => {
        if (err) {
          done(err.message);
          return;
        }

        validateFiles(options, type, (err) => {
          if (err) {
            done(err.message);
            return;
          }
          done();
        });
      });
    });

    it('extract file without type - options as type, no strip', (done) => {
      const options = type;
      extract(path.join(DATA_DIR, `fixture-${type}`), TARGET, options, (err) => {
        if (err) {
          done(err.message);
          return;
        }

        validateFiles(options, type, (err) => {
          if (err) {
            done(err.message);
            return;
          }
          done();
        });
      });
    });

    it('extract file by stream - filename', (done) => {
      const options = { strip: 1 };
      const stream = fs.createReadStream(path.join(DATA_DIR, `fixture-${type}`));
      (stream as SpecifiedStream).filename = `fixture.${type}`;
      extract(stream, TARGET, options, (err) => {
        if (err) {
          done(err.message);
          return;
        }

        validateFiles(options, type, (err) => {
          if (err) {
            done(err.message);
            return;
          }
          done();
        });
      });
    });

    it('extract file by stream - basename', (done) => {
      const options = { strip: 1 };
      const stream = fs.createReadStream(path.join(DATA_DIR, `fixture-${type}`));
      (stream as SpecifiedStream).basename = `fixture.${type}`;
      extract(stream, TARGET, options, (err) => {
        if (err) {
          done(err.message);
          return;
        }

        validateFiles(options, type, (err) => {
          if (err) {
            done(err.message);
            return;
          }
          done();
        });
      });
    });
  });
}

describe('extensions', () => {
  beforeEach((callback) => {
    rimraf2(TMP_DIR, { disableGlob: true }, () => {
      mkdirp(TMP_DIR, callback);
    });
  });

  for (let index = 0; index < EXTRACT_TYPES.length; index++) addTests(EXTRACT_TYPES[index]);
});
