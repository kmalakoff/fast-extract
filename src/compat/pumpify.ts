import Module from 'module';
import type t from 'pumpify';

const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;
const major = +process.versions.node.split('.')[0];

const pumpify = major <= 10 ? _require('../../../assets/pumpify.cjs') : _require('pumpify');

export default pumpify as typeof t;
