/**
 * T15: Deployment Readiness Checklist
 * Validates all HOSTING.md requirements against actual configuration.
 * This is the final gate before deployment.
 */
import * as fs from 'fs';
import * as path from 'path';
import nextConfig from '../../next.config.js';

const ROOT = path.resolve(__dirname, '../../');

describe('deployment readiness: backend build settings', () => {
  it('output mode is standalone (HOSTING.md requirement)', () => {
    expect(nextConfig.output).toBe('standalone');
  });

  it('build command exists in package.json', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
    expect(pkg.scripts.build).toBe('next build');
  });

  it('Node.js engine >= 18 is declared', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
    expect(pkg.engines?.node).toBeDefined();
    // Extract the major version number from the constraint
    const match = pkg.engines.node.match(/(\d+)/);
    expect(Number(match?.[1])).toBeGreaterThanOrEqual(18);
  });
});

describe('deployment readiness: required environment variables', () => {
  it('prisma schema references DATABASE_URL', () => {
    const schema = fs.readFileSync(path.join(ROOT, 'prisma/schema.prisma'), 'utf-8');
    expect(schema).toContain('env("DATABASE_URL")');
  });

  it('prisma schema references DIRECT_URL', () => {
    const schema = fs.readFileSync(path.join(ROOT, 'prisma/schema.prisma'), 'utf-8');
    expect(schema).toContain('env("DIRECT_URL")');
  });

  it('JWT_SECRET is used in the codebase', () => {
    const jwtLib = fs.readFileSync(path.join(ROOT, 'src/lib/jwt.ts'), 'utf-8');
    expect(jwtLib).toContain('JWT_SECRET');
  });

  it('next.config.js declares NEXT_PUBLIC_API_URL in env block', () => {
    expect('NEXT_PUBLIC_API_URL' in (nextConfig.env ?? {})).toBe(true);
  });
});

describe('deployment readiness: security', () => {
  let headerRules: Awaited<ReturnType<NonNullable<typeof nextConfig.headers>>>;

  beforeAll(async () => {
    headerRules = await nextConfig.headers!();
  });

  it('security headers are configured on /api routes', () => {
    const apiRule = headerRules.find((r) => r.source === '/api/:path*');
    expect(apiRule).toBeDefined();
    const keys = apiRule!.headers.map((h) => h.key);
    expect(keys).toContain('X-Content-Type-Options');
    expect(keys).toContain('X-Frame-Options');
    expect(keys).toContain('X-XSS-Protection');
  });

  it('image optimization is disabled (API-only backend)', () => {
    expect(nextConfig.images?.unoptimized).toBe(true);
  });
});

describe('deployment readiness: database', () => {
  it('prisma schema uses postgresql provider', () => {
    const schema = fs.readFileSync(path.join(ROOT, 'prisma/schema.prisma'), 'utf-8');
    expect(schema).toContain('provider = "postgresql"');
  });

  it('prisma client generator is configured', () => {
    const schema = fs.readFileSync(path.join(ROOT, 'prisma/schema.prisma'), 'utf-8');
    expect(schema).toContain('provider = "prisma-client-js"');
  });

  it('db:push script exists for schema sync', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
    expect(pkg.scripts['db:push']).toBeDefined();
  });
});

describe('deployment readiness: API routes', () => {
  const apiDir = path.join(ROOT, 'src/app/api');

  it('health endpoint exists', () => {
    expect(fs.existsSync(path.join(apiDir, 'health/route.ts'))).toBe(true);
  });

  it('auth endpoints exist', () => {
    expect(fs.existsSync(path.join(apiDir, 'auth/login/route.ts'))).toBe(true);
    expect(fs.existsSync(path.join(apiDir, 'auth/register/route.ts'))).toBe(true);
  });

  it('cards endpoint exists', () => {
    expect(fs.existsSync(path.join(apiDir, 'cards/route.ts'))).toBe(true);
  });

  it('readings endpoint exists', () => {
    expect(fs.existsSync(path.join(apiDir, 'readings/route.ts'))).toBe(true);
  });

  it('no route exports edge runtime', () => {
    function walk(dir: string): string[] {
      const results: string[] = [];
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) results.push(...walk(full));
        else if (e.name === 'route.ts') results.push(full);
      }
      return results;
    }
    for (const file of walk(apiDir)) {
      const content = fs.readFileSync(file, 'utf-8');
      expect(content).not.toMatch(/export\s+(const|let|var)\s+runtime\s*=\s*['"]edge['"]/);
    }
  });
});
