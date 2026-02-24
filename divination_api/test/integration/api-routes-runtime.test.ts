/**
 * T11: API Routes Runtime Tests
 * Validates that all API route files export correct HTTP handlers
 * and that database-dependent routes use Node.js-compatible imports.
 * These are static analysis tests — no running server required.
 */
import * as fs from 'fs';
import * as path from 'path';

const API_DIR = path.resolve(__dirname, '../../src/app/api');

function getRouteFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getRouteFiles(full));
    } else if (entry.name === 'route.ts') {
      results.push(full);
    }
  }
  return results;
}

describe('API routes runtime validation', () => {
  const routeFiles = getRouteFiles(API_DIR);

  it('finds at least one API route file', () => {
    expect(routeFiles.length).toBeGreaterThan(0);
  });

  it.each(routeFiles.map((f) => [path.relative(API_DIR, f), f]))(
    '%s exports at least one HTTP method handler',
    async (_label, filePath) => {
      const mod = await import(filePath);
      const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
      const exported = methods.filter((m) => typeof mod[m] === 'function');
      expect(exported.length).toBeGreaterThan(0);
    }
  );

  it('no route file declares edge runtime export', () => {
    for (const file of routeFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      expect(content).not.toMatch(/export\s+(const|let|var)\s+runtime\s*=\s*['"]edge['"]/);
    }
  });

  it('database routes import from @/lib/db (Node.js Prisma)', () => {
    const dbRoutes = routeFiles.filter((f) => {
      const content = fs.readFileSync(f, 'utf-8');
      return content.includes('prisma');
    });
    expect(dbRoutes.length).toBeGreaterThan(0);
    for (const file of dbRoutes) {
      const content = fs.readFileSync(file, 'utf-8');
      expect(content).toMatch(/@\/lib\/db/);
    }
  });
});
