import type t from 'flush-write-stream';
import Module from 'module';

const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;
const major = +process.versions.node.split('.')[0];

const flushWriteStream = major <= 10 ? _require('../../../assets/flush-write-stream.cjs') : _require('flush-write-stream');

export default flushWriteStream as typeof t;
