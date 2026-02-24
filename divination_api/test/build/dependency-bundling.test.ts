import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../../');
const STANDALONE_DIR = path.join(ROOT, '.next', 'standalone');

describe('dependency bundling in standalone output', () => {
  beforeAll(() => {
    execSync('pnpm build', { cwd: ROOT, stdio: 'pipe' });
  }, 120000);

  it('bundles @prisma/client in standalone node_modules', () => {
    const prismaClient = path.join(STANDALONE_DIR, 'node_modules', '@prisma', 'client');
    expect(fs.existsSync(prismaClient)).toBe(true);
  });

  it('bundles prisma engines in standalone node_modules', () => {
    const prismaDir = path.join(STANDALONE_DIR, 'node_modules', '.prisma');
    expect(fs.existsSync(prismaDir)).toBe(true);
  });

  it('standalone node_modules is not empty', () => {
    const nodeModules = path.join(STANDALONE_DIR, 'node_modules');
    const entries = fs.readdirSync(nodeModules);
    expect(entries.length).toBeGreaterThan(0);
  });

  it('package.json is present in standalone root', () => {
    const pkg = path.join(STANDALONE_DIR, 'package.json');
    expect(fs.existsSync(pkg)).toBe(true);
  });
});
