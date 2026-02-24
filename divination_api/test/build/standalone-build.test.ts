import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../../');
const STANDALONE_DIR = path.join(ROOT, '.next', 'standalone');
const NEXT_DIR = path.join(ROOT, '.next');

describe('standalone build output', () => {
  beforeAll(() => {
    execSync('pnpm build', { cwd: ROOT, stdio: 'pipe' });
  }, 120000);

  it('produces a .next directory', () => {
    expect(fs.existsSync(NEXT_DIR)).toBe(true);
  });

  it('produces a .next/standalone directory', () => {
    expect(fs.existsSync(STANDALONE_DIR)).toBe(true);
  });

  it('standalone directory contains server.js', () => {
    const serverJs = path.join(STANDALONE_DIR, 'server.js');
    expect(fs.existsSync(serverJs)).toBe(true);
  });

  it('standalone directory contains node_modules', () => {
    const nodeModules = path.join(STANDALONE_DIR, 'node_modules');
    expect(fs.existsSync(nodeModules)).toBe(true);
  });

  it('build manifest exists', () => {
    const manifest = path.join(NEXT_DIR, 'build-manifest.json');
    expect(fs.existsSync(manifest)).toBe(true);
  });
});
