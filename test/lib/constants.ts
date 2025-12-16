import path from 'path';
import url from 'url';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
export const TMP_DIR = path.join(path.join(__dirname, '..', '..', '.tmp'));
export const TARGET = path.join(path.join(TMP_DIR, 'target'));
export const CONTENTS = '// eslint-disable-next-line no-unused-vars\nvar thing = true;\n';
