import { existsSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const siteRoot = fileURLToPath(new URL('../', import.meta.url));
const repositoryRoot = resolve(siteRoot, '../../..');
if (!existsSync(join(repositoryRoot, 'vercel.json'))) throw new Error('Cannot locate the deployment root.');
const localOutput = join(siteRoot, '.vercel/output');
const deployOutput = join(repositoryRoot, '.vercel/output');
for (const target of [localOutput, deployOutput]) {
  const withinRepository = relative(repositoryRoot, target);
  if (withinRepository.startsWith('..') || !target.endsWith(join('.vercel', 'output'))) {
    throw new Error('Build output must stay inside this repository.');
  }
}
const run = (...args) => {
  const result = spawnSync(process.execPath, args, {
    cwd: siteRoot,
    env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
};
// Only generated output is replaced; local Vercel project settings are preserved.
rmSync(localOutput, { recursive: true, force: true });
run('scripts/content-i18n-check.mjs');
run('node_modules/astro/bin/astro.mjs', 'check');
run('node_modules/astro/bin/astro.mjs', 'build');
run('scripts/postbuild-sitemap.mjs');
run('scripts/site-locale-check.mjs');
run('scripts/site-heading-check.mjs');
run('scripts/site-markdown-check.mjs');
if (existsSync(localOutput)) {
  rmSync(deployOutput, { recursive: true, force: true });
  mkdirSync(dirname(deployOutput), { recursive: true });
  renameSync(localOutput, deployOutput);
  run('scripts/postbuild-vercel-config.mjs');
  run('--test', 'scripts/vercel-output.test.mjs');
}
