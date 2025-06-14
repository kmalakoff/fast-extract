import path from 'path';

export default function extname(fullPath: string): string {
  const basename = path.basename(fullPath);
  const index = basename.indexOf('.');
  return index >= 0 ? basename.slice(index) : '';
}
