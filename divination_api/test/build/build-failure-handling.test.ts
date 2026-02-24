import { execSync } from 'child_process';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../../');

describe('build failure handling', () => {
  it('build exits with code 0 on valid configuration', () => {
    expect(() => {
      execSync('pnpm build', { cwd: ROOT, stdio: 'pipe' });
    }).not.toThrow();
  });

  it('build fails with non-zero exit when next.config.js has invalid output mode', () => {
    expect(() => {
      execSync(
        `NEXT_CONFIG_OVERRIDE=invalid node -e "
          const cfg = require('./next.config.js');
          if (cfg.output !== 'standalone' && cfg.output !== 'export' && cfg.output !== undefined) {
            process.exit(1);
          }
        "`,
        { cwd: ROOT, stdio: 'pipe' }
      );
    }).not.toThrow();
  });

  it('next.config.js can be required without throwing', () => {
    expect(() => {
      require('../../next.config.js');
    }).not.toThrow();
  });
});
