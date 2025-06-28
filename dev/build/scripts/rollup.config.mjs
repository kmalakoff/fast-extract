import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import Module from 'module';
import externals from 'rollup-plugin-node-externals';
import swc from 'ts-swc-rollup-plugin';

const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;

const replacements = {};

const escapeString = (string) => string.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
const replace = (replacements) => ({
  name: 'replace',
  transform: (code) => Object.keys(replacements).reduce((m, r) => m.replace(new RegExp(escapeString(r), 'g'), replacements[r]), code),
});

export default {
  output: { format: 'cjs', strict: false },
  plugins: [
    replace(replacements),
    alias({
      entries: [
        { find: 'bl', replacement: _require.resolve('bl') },
        {
          find: 'readable-stream',
          replacement: _require.resolve('readable-stream'),
        },
      ],
    }),
    resolve(),
    commonjs(),
    externals({ deps: false, devDeps: false, builtinsPrefix: 'strip' }),
    swc(),
  ],
};
