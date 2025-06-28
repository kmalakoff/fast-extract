import Module from 'module';
import type t from 'unbzip2-stream';

const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;
const major = +process.versions.node.split('.')[0];

const flushWriteStream = major <= 10 ? _require('../../../assets/unbzip2-stream.cjs') : _require('unbzip2-stream');

export default flushWriteStream as typeof t;
