import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const siteRoot = fileURLToPath(new URL('../', import.meta.url));
const repoRoot = resolve(siteRoot, '../../..');
const require = createRequire(import.meta.url);
const { getTransformedRoutes, mergeRoutes } = require('@vercel/routing-utils');
const user = JSON.parse(readFileSync(resolve(repoRoot, 'vercel.json'), 'utf8'));
const path = resolve(repoRoot, '.vercel/output/config.json');
const output = JSON.parse(readFileSync(path, 'utf8'));
if (output.version !== 3) throw new Error('Expected Vercel Build Output API version 3.');
const transformed = getTransformedRoutes({ redirects: user.redirects, headers: user.headers, rewrites: user.rewrites, trailingSlash: user.trailingSlash });
if (transformed.error) throw new Error(JSON.stringify(transformed.error));
// Prebuilt deployments consume this file directly, including rules before filesystem lookup.
output.routes = mergeRoutes({ userRoutes: transformed.routes, builds: [{ entrypoint: '.', use: '@astrojs/vercel', routes: output.routes }] });
writeFileSync(path, JSON.stringify(output, null, 2) + '\n');
console.log('Vercel build output includes canonical redirects and response headers.');
