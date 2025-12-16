import path from 'path';
import url from 'url';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
export const DATA_DIR = path.join(__dirname, '..', 'data');

export interface FixtureExpected {
  dirs: number;
  files: number;
  links: number;
}

const FIXTURES: Record<string, FixtureExpected> = {
  'fixture.tar': { dirs: 3, files: 7, links: 5 },
  'fixture.tar.bz2': { dirs: 3, files: 7, links: 5 },
  'fixture.tar.gz': { dirs: 3, files: 7, links: 5 },
  'fixture.tar.xz': { dirs: 3, files: 7, links: 5 },
  'fixture.tgz': { dirs: 3, files: 7, links: 5 },
  'fixture.zip': { dirs: 3, files: 7, links: 5 },
  'fixture.7z': { dirs: 3, files: 7, links: 5 },
};

export function getFixture(name: string) {
  const expected = FIXTURES[name];
  if (!expected) throw new Error(`Unknown fixture: ${name}. Add it to FIXTURES in test/lib/fixtures.ts`);
  return {
    path: path.join(DATA_DIR, name),
    expected,
  };
}
