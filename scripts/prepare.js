import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

const isCI = Boolean(process.env.CI || process.env.VERCEL || process.env.NETLIFY || process.env.GITHUB_ACTIONS);
if (isCI) {
  const hasDist = existsSync(new URL('../dist/index.js', import.meta.url));
  if (!hasDist) {
    console.warn('[prepare] CI detected but dist missing; skipping prepack anyway.');
  } else {
    console.log('[prepare] CI detected; skipping prepack.');
  }
  process.exit(0);
}

if (process.env.SKIP_PREPARE) {
  console.log('[prepare] SKIP_PREPARE set; skipping prepack.');
  process.exit(0);
}

execSync('npm run prepack', { stdio: 'inherit' });
