import assert from 'node:assert/strict';
import { readFile, mkdtemp, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { test } from 'node:test';

// Run from the Astro project. This starts and stops its own local dev server;
// an empty envDir and REDIS_URL keep production credentials/data out of the test.
const project = process.cwd();
const require = createRequire(join(project, 'package.json'));
const { getTransformedRoutes } = require('@vercel/routing-utils');
const { dev } = await import(pathToFileURL(join(project, 'node_modules/astro/dist/index.js')));
const aliases = new Map([
  ['/reset', '/whenreset/'],
  ['/whenrest', '/whenreset/'],
  ['/en/reset', '/en/whenreset/'],
  ['/en/whenrest', '/en/whenreset/'],
]);
const attr = (tag, name) => new RegExp(`\\b${name}=["']([^"']*)["']`, 'i').exec(tag)?.[1]?.replaceAll('&amp;', '&');

await test('Vercel permanent aliases match both slash forms without capturing main routes', async () => {
  const config = JSON.parse(await readFile(resolve(project, '../../../vercel.json'), 'utf8'));
  const result = getTransformedRoutes({ redirects: config.redirects, headers: config.headers, trailingSlash: config.trailingSlash });
  assert.equal(result.error, null);
  for (const [alias, target] of aliases) {
    const rule = config.redirects.find((rule) => rule.source === `${alias}{/}?`);
    assert.ok(rule, `missing edge redirect: ${alias}`);
    assert.equal(rule.destination, target);
    assert.equal(rule.permanent, true);
    const permanentRoutes = result.routes.filter((route) => route.status === 308 && route.headers?.Location === target && !route.has);
    for (const pathname of [alias, `${alias}/`]) {
      assert.ok(permanentRoutes.some((route) => new RegExp(route.src).test(pathname)), `no permanent alias route for ${pathname}`);
    }
    for (const pathname of ['/whenreset/', '/en/whenreset/', '/tokenrank/', '/en/tokenrank/', `${alias}-extra/`, `${alias}/extra/`]) {
      assert.ok(permanentRoutes.every((route) => !new RegExp(route.src).test(pathname)), `alias captures main route: ${pathname}`);
    }
    const source = await readFile(join(project, 'src/pages', alias, 'index.astro'), 'utf8');
    assert.match(source, /export\s+const\s+prerender\s*=\s*false/, 'alias must remain SSR rather than static meta refresh');
  }
});

const envDir = await mkdtemp(join(tmpdir(), 'tsalon-redirect-env-'));
process.env.REDIS_URL = '';
process.env.AUTH_SECRET = 'local-route-regression-test-only';
process.env.AUTH_TRUST_HOST = 'true';
let server;
try {
  server = await dev({ root: project, envDir, server: { port: 4327, host: '127.0.0.1' }, logLevel: 'error', devToolbar: { enabled: false } });
  const base = `http://127.0.0.1:${server.address.port}`;
  await test('aliases return HTTP 308 and retain query strings for GET and HEAD', async () => {
    for (const [alias, target] of aliases) {
      for (const slash of ['', '/']) {
        for (const method of ['GET', 'HEAD']) {
          const response = await fetch(`${base}${alias}${slash}?tool=claude&plan=pro`, { method, redirect: 'manual' });
          assert.equal(response.status, 308, `${method} ${alias}${slash}`);
          assert.equal(response.headers.get('location'), `${target}?tool=claude&plan=pro`);
          assert.doesNotMatch(await response.text(), /http-equiv\s*=\s*["']?refresh/i);
        }
      }
    }
  });
  await test('TokenRank canonical/hreflang are clean while both language switches retain resolved filters', async () => {
    const cases = [
      ['', 'today', 'total'],
      ['?time=7d&metric=cost', '7d', 'cost'],
      ['?time=90d&metric=norm', '90d', 'norm'],
      ['?time=invalid&metric=invalid', 'today', 'total'],
      ['?time=all&mode=cost', 'all', 'cost'],
    ];
    for (const locale of ['zh', 'en']) {
      const pathname = locale === 'zh' ? '/tokenrank/' : '/en/tokenrank/';
      const otherPath = locale === 'zh' ? '/en/tokenrank/' : '/tokenrank/';
      for (const [query, time, metric] of cases) {
        const response = await fetch(`${base}${pathname}${query}`);
        assert.equal(response.status, 200, `${pathname}${query}`);
        const html = await response.text();
        const links = html.match(/<link\b[^>]*>/gi) ?? [];
        const canonical = links.find((tag) => attr(tag, 'rel') === 'canonical');
        assert.equal(attr(canonical, 'href'), `https://www.tsalon.tech${pathname}`);
        for (const [lang, path] of [['zh-Hans', '/tokenrank/'], ['en', '/en/tokenrank/'], ['x-default', '/tokenrank/']]) {
          const link = links.find((tag) => attr(tag, 'hreflang') === lang);
          assert.equal(attr(link, 'href'), `https://www.tsalon.tech${path}`, `${locale} ${query} ${lang}`);
        }
        const switches = (html.match(/<a\b[^>]*>/gi) ?? []).filter((tag) => /(?:language-switch|mobile-menu-language)/.test(attr(tag, 'class') ?? ''));
        assert.equal(switches.length, 2, 'desktop and mobile language switches');
        for (const tag of switches) assert.equal(attr(tag, 'href'), `${otherPath}?time=${time}&metric=${metric}`);
      }
    }
  });
} finally {
  await server?.stop();
  await rmdir(envDir);
}
