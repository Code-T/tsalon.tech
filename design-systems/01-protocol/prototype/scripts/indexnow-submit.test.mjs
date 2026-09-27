import assert from 'node:assert/strict';
import test from 'node:test';
import { urlsForChanges, extractLocs } from './indexnow-submit.mjs';

const origin = 'https://www.tsalon.tech';

test('article edits notify the canonical article and its listing', () => {
  const sitemap = [`${origin}/articles/example/`, `${origin}/articles/`, `${origin}/`];
  const urls = urlsForChanges([{ status: 'M', path: 'design-systems/01-protocol/prototype/src/content/articles/example.md' }], sitemap);
  assert.deepEqual(urls, [`${origin}/articles/`, `${origin}/articles/example/`]);
});

test('deleted event URLs are submitted even after disappearing from sitemap', () => {
  const urls = urlsForChanges([{ status: 'D', path: 'design-systems/01-protocol/prototype/src/content/events/old-event.md' }], [`${origin}/events/`]);
  assert.deepEqual(urls, [`${origin}/events/`, `${origin}/events/old-event/`]);
});

test('shared page changes notify current sitemap URLs only', () => {
  const sitemap = [`${origin}/`, `${origin}/en/about/`, 'https://other.example/page/', `${origin}/articles/`];
  const urls = urlsForChanges([{ status: 'M', path: 'design-systems/01-protocol/prototype/src/layouts/BaseLayout.astro' }], sitemap);
  assert.deepEqual(urls, [`${origin}/`, `${origin}/articles/`, `${origin}/en/about/`]);
});

test('a deletion is still reported when shared code also changes', () => {
  const sitemap = [`${origin}/`, `${origin}/events/`];
  const urls = urlsForChanges([
    { status: 'D', path: 'design-systems/01-protocol/prototype/src/content/events/old-event.md' },
    { status: 'M', path: 'design-systems/01-protocol/prototype/src/layouts/BaseLayout.astro' },
  ], sitemap);
  assert.deepEqual(urls, [`${origin}/`, `${origin}/events/`, `${origin}/events/old-event/`]);
});

test('workflow-only changes do not submit pages', () => {
  assert.deepEqual(urlsForChanges([{ status: 'M', path: '.github/workflows/indexnow.yml' }], [`${origin}/`]), []);
});

test('sitemap parser extracts loc values', () => {
  assert.deepEqual(extractLocs('<urlset><url><loc>https://www.tsalon.tech/a/</loc></url><url><loc>https://www.tsalon.tech/b/</loc></url></urlset>'), [`${origin}/a/`, `${origin}/b/`]);
});
