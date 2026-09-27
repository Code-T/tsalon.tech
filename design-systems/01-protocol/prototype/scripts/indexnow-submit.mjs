import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ORIGIN = 'https://www.tsalon.tech';
const SITE_PREFIX = 'design-systems/01-protocol/prototype/';
const KEY_FILE = 'd1e93d5305524f8bb40cc36712efb979.txt';
const KEY = readFileSync(new URL(`../public/${KEY_FILE}`, import.meta.url), 'utf8').trim();
const KEY_URL = `${ORIGIN}/${KEY_FILE}`;

if (KEY !== basename(KEY_FILE, '.txt')) throw new Error('IndexNow key file name and contents differ.');

export function extractLocs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((match) => match[1].replaceAll('&amp;', '&'));
}

export function urlsForChanges(changes, sitemapUrls) {
  const published = new Set(sitemapUrls.filter((url) => {
    try {
      const parsed = new URL(url);
      return parsed.origin === ORIGIN && !parsed.search && !parsed.hash;
    } catch {
      return false;
    }
  }));
  const selected = new Set();
  let siteWideChange = false;

  for (const { status, path } of changes) {
    const normalized = path.replaceAll('\\', '/');
    if (normalized === `${SITE_PREFIX}public/${KEY_FILE}`) {
      if (status === 'A' && published.has(`${ORIGIN}/`)) selected.add(`${ORIGIN}/`);
      continue;
    }
    if (!normalized.startsWith(SITE_PREFIX)) continue;
    const local = normalized.slice(SITE_PREFIX.length);
    if (local === 'scripts/indexnow-submit.mjs' || local === 'scripts/indexnow-submit.test.mjs') continue;

    const content = /^src\/content\/(articles|articles-en|events|events-en)\/([^/]+)\.md$/.exec(local);
    if (content) {
      const [, folder, slug] = content;
      const kind = folder.startsWith('articles') ? 'articles' : 'events';
      const locale = folder.endsWith('-en') ? '/en' : '';
      const page = `${ORIGIN}${locale}/${kind}/${slug}/`;
      if (status === 'D' || published.has(page)) selected.add(page);
      const listing = `${ORIGIN}${locale}/${kind}/`;
      if (published.has(listing)) selected.add(listing);
      continue;
    }

    if (!local.endsWith('.test.mjs') && !local.startsWith('docs/')) siteWideChange = true;
  }

  return [...new Set([...(siteWideChange ? published : []), ...selected])].sort();
}

function changesBetween(from, to) {
  const output = execFileSync('git', ['diff', '--name-status', '--find-renames', from, to, '--'], {
    cwd: fileURLToPath(new URL('../../../..', import.meta.url)),
    encoding: 'utf8',
  });
  return output.trim().split(/\r?\n/).filter(Boolean).flatMap((line) => {
    const [rawStatus, oldPath, newPath] = line.split('\t');
    const status = rawStatus[0];
    if (status === 'R') return [{ status: 'D', path: oldPath }, { status: 'A', path: newPath }];
    return [{ status, path: oldPath }];
  });
}

async function fetchText(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  return response.text();
}

async function publishedUrls() {
  const sitemap = extractLocs(await fetchText(`${ORIGIN}/sitemap-index.xml`));
  const pages = await Promise.all(sitemap.map((url) => fetchText(url).then(extractLocs)));
  return pages.flat();
}

async function verifyPublishedKey() {
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      if ((await fetchText(KEY_URL)).trim() === KEY) return;
    } catch (error) {
      if (attempt === 5) throw error;
    }
    if (attempt < 5) await new Promise((done) => setTimeout(done, 10000));
  }
  throw new Error(`Production key at ${KEY_URL} does not match the repository.`);
}

async function main() {
  const [from = 'HEAD^', to = 'HEAD'] = process.argv.slice(2);
  const changes = changesBetween(from, to);
  const urls = urlsForChanges(changes, await publishedUrls());
  if (urls.length === 0) {
    console.log('IndexNow: no changed public URLs to submit.');
    return;
  }
  await verifyPublishedKey();
  const response = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: 'www.tsalon.tech', key: KEY, keyLocation: KEY_URL, urlList: urls }),
    signal: AbortSignal.timeout(15000),
  });
  if (![200, 202].includes(response.status)) {
    throw new Error(`IndexNow rejected ${urls.length} URLs: HTTP ${response.status} ${(await response.text()).slice(0, 300)}`);
  }
  console.log(`IndexNow: ${response.status === 202 ? 'received, key validation pending' : 'accepted'} ${urls.length} changed URLs.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
