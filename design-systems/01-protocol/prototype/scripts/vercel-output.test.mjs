import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
const site = fileURLToPath(new URL('../', import.meta.url));
const repo = resolve(site, '../../..');
const directory = join(repo, '.vercel/output');
const output = JSON.parse(readFileSync(join(directory, 'config.json'), 'utf8'));
const config = JSON.parse(readFileSync(join(repo, 'vercel.json'), 'utf8'));
const edgeRoutes = output.routes.slice(0, output.routes.findIndex(route => route.handle === 'filesystem'));
const redirect = (url) => {
  for (const route of edgeRoutes) {
    if (!route.status || !route.headers?.Location) continue;
    if (route.has?.some(condition => condition.type === 'host' && condition.value !== url.hostname)) continue;
    const match = new RegExp(route.src).exec(url.pathname);
    if (!match) continue;
    const location = route.headers.Location.replace(/\$(\d+)/g, (_, index) => match[Number(index)] ?? '');
    const next = new URL(location, url);
    if (!next.search) next.search = url.search;
    return { status: route.status, url: next };
  }
};
const follow = (value) => {
  let url = new URL(value);
  const seen = new Set();
  for (let step = 0; step < 5; step++) {
    assert.ok(!seen.has(url.href), `Redirect loop: ${value}`);
    seen.add(url.href);
    const result = redirect(url);
    if (!result) return url;
    assert.equal(result.status, 308);
    url = result.url;
  }
  assert.fail(`Too many redirects: ${value}`);
};
const staticHtml = pathname => readFileSync(join(directory, 'static', pathname, 'index.html'), 'utf8');
await test('production artifact retains redirects before filesystem lookup, including all 17 English recordings', () => {
  assert.ok(edgeRoutes.length > 17, 'Prebuilt artifact lost vercel.json routes');
  const examples = new Map([
    ['/stories/', '/events/'], ['/stories', '/events/'],
    ['/en/stories/', '/en/events/'], ['/archives/', '/articles/'],
    ['/gallery/', '/history/'], ['/about/index.html', '/about/'],
  ]);
  for (const rule of config.redirects.filter(rule => rule.source.startsWith('/en/articles/tchat-'))) {
    for (const suffix of ['', '/']) examples.set(rule.source.replace('{/}?', suffix), rule.destination);
  }
  for (const [source, target] of examples) {
    const final = follow(`https://www.tsalon.tech${source}?source=old-link`);
    assert.equal(final.pathname, target);
    assert.equal(final.search, '?source=old-link');
    assert.ok(existsSync(join(directory, 'static', target, 'index.html')), `Missing final page: ${target}`);
  }
  for (const path of ['/', '/articles/', '/tokenrank/', '/robots.txt']) {
    const final = follow(`https://tsalon.tech${path}`);
    assert.equal(final.hostname, 'www.tsalon.tech');
    assert.equal(final.pathname, path);
    assert.equal(redirect(final), undefined);
  }
  for (const path of ['/whenreset/', '/en/whenreset/', '/tokenrank/', '/en/tokenrank/']) {
    assert.equal(follow(`https://www.tsalon.tech${path}`).pathname, path);
    assert.ok(output.routes.some(route => route.dest === '_render' && new RegExp(route.src).test(path)));
  }
  assert.ok(edgeRoutes.some(route => route.headers?.['Cache-Control']?.includes('no-store') && new RegExp(route.src).test('/scripts/tokenrank-agent.sh')));
  assert.ok(output.routes.some(route => route.status === 404), 'Unknown URLs must retain a real 404');
});
await test('built event and video markup has the missing fields and a visible author target', () => {
  const schemasOf = html => [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1])).flat();
  for (const prefix of ['', '/en']) {
    const directorySchemas = schemasOf(staticHtml(`${prefix}/events/`));
    const directorySchema = directorySchemas.find(schema => schema['@type'] === 'CollectionPage');
    assert.equal(directorySchema.mainEntity['@type'], 'ItemList');
    const items = directorySchema.mainEntity.itemListElement;
    assert.equal(items.length, 10);
    assert.equal(new Set(items.map(item => item.url)).size, items.length);
    for (const [index, item] of items.entries()) {
      assert.equal(item['@type'], 'ListItem');
      assert.equal(item.position, index + 1);
      const path = new URL(item.url).pathname;
      assert.ok(path.startsWith(`${prefix}/events/`));
      assert.ok(existsSync(join(directory, 'static', path, 'index.html')));
    }
    assert.ok(!JSON.stringify(directorySchemas).includes('"@type":"Event"'), 'Event directories must not claim to be individual ticket offers');
    const archivePaths = ['hdx-4876922233100', 'hdx-2873441823200', 'hdx-7870619038900', 'tchat-series-launch', ...['hdx-7732324341700', 'hdx-3711187585200', 'hdx-6704677921900', 'hdx-1703870201300', 'hdx-4704118639500', 'hdx-8699104705200'].map(id => 'archive/' + id)];
    for (const id of archivePaths) {
      const path = `${prefix}/events/${id}/`;
      const html = staticHtml(path);
      const archiveSchemas = schemasOf(html);
      assert.ok(!JSON.stringify(archiveSchemas).includes('"@type":"Event"'), 'Past-event records must not advertise current ticket offers: ' + path);
      assert.ok(archiveSchemas.some(schema => schema['@type'] === 'WebPage' && schema.url === 'https://www.tsalon.tech' + path));
      assert.match(html, /<h1[\s>]/);
      assert.ok(html.includes('已结束') || html.includes('Ended'));
      assert.ok(!html.includes('name="robots" content="noindex"'));
    }
  }
  const recording = staticHtml('/articles/tchat-8/');
  assert.match(recording, /id="speaker"/);
  const player = recording.match(/<iframe[^>]*src="([^"]+)"/)[1].replaceAll('&amp;', '&');
  assert.equal(new URL(player).searchParams.get('autoplay'), '0');
  assert.equal(new URL(player).searchParams.get('p'), '1');
  assert.ok(recording.includes(JSON.stringify(player)), 'Video schema must describe the player actually displayed');
  assert.match(recording, /"author":\{"@type":"Person","name":"莲叔","url":"https:\/\/www\.tsalon\.tech\/articles\/tchat-8\/#speaker"\}/);
  assert.ok(recording.indexOf('<iframe') < recording.indexOf('content-detail-body'), 'Primary recording must precede secondary article content');
});
