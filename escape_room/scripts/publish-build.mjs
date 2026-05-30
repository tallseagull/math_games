import { cpSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const targetAssets = join(root, 'assets');

cpSync(join(dist, 'index.html'), join(root, 'index.html'));

if (existsSync(targetAssets)) {
  rmSync(targetAssets, { recursive: true });
}
cpSync(join(dist, 'assets'), targetAssets, { recursive: true });
