import Module from 'module';

const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;

export default function optionalRequire(name: string): unknown {
  try {
    return _require(name);
  } catch (_err) {
    return null;
  }
}
