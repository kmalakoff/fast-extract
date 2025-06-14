import Module from 'module';
import requireOptional from 'require_optional';

const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;

export default function optionalRequire(name: string): unknown {
  try {
    const mod = _require(name);
    if (mod) return mod;
  } catch (_err) {}

  try {
    const mod2 = requireOptional(name);
    if (mod2) return mod2;
  } catch (_err) {}
  return null;
}
