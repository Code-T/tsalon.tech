import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

test('unreviewed source transcripts are not shipped as public assets', () => {
  const root = 'public/transcripts';
  const files = existsSync(root) ? readdirSync(root, { recursive: true }).filter(file => /\.(txt|srt|json)$/i.test(String(file))) : [];
  assert.deepEqual(files, [], 'Raw editing materials must stay outside the website');
  assert.equal(existsSync('src/data/transcripts.json'), false);
  assert.equal(existsSync('scripts/import-transcripts.mjs'), false, 'Retire the raw-transcript publication path');
});

test('reader pages contain edited recaps and video sources, not production workflow', () => {
  const route = readFileSync('src/pages/articles/[id].astro', 'utf8');
  assert.doesNotMatch(route, /TranscriptResources|\/transcripts\//);
  const recaps = readdirSync('src/content/articles').filter(file => file.endsWith('-recap.md'));
  assert.ok(recaps.length >= 17);
  for (const file of recaps) {
    const source = readFileSync(join('src/content/articles', file), 'utf8');
    assert.doesNotMatch(source, /自动转录|全文转录|转录资源|人工校听|未经嘉宾逐句|本地转录|内部审稿|内部核验记录|接入前另行校验|TXT|SRT|\/transcripts\//, file);
    if (/^related(?:Talks|Recordings):/m.test(source)) assert.match(source, /https:\/\/www\.bilibili\.com\/video\//, file);
  }
});


test('recording archives expose exact original videos and edited articles only', () => {
  for (const file of ['src/pages/recordings/index.astro', 'src/pages/recordings/[id].astro']) {
    const source = readFileSync(file, 'utf8');
    assert.doesNotMatch(source, /TranscriptResources|\/transcripts\/|自动转录|人工校听|TXT|SRT/, file);
    assert.match(source, /relatedRecordings/);
    assert.match(source, /!data\.draft && !data\.seo\.noindex/);
  }
  const recordings = JSON.parse(readFileSync('src/data/recordings.json', 'utf8'));
  assert.equal(recordings.length, 17);
  assert.equal(recordings.reduce((n, item) => n + item.videoParts.length, 0), 31);
  assert.doesNotMatch(JSON.stringify(recordings), /自动转录|人工校听|全文转录|\/transcripts\/|已完成回顾/);
  const identities = new Set();
  for (const item of recordings) {
    assert.equal('episode' in item, false, `${item.id}: do not invent a T Chat episode`);
    assert.equal(item.eventDate, item.id === 'shenzhen-frontend-challenges' ? '2022-05-08' : null,
      `${item.id}: only a separately documented event date may be published`);
    assert.equal(item.durationSeconds, item.videoParts.reduce((n, part) => n + part.durationSeconds, 0));
    for (const part of item.videoParts) {
      const url = new URL(part.url);
      assert.equal(url.hostname, 'www.bilibili.com');
      assert.equal(url.pathname, `/video/${part.bvid}`);
      assert.equal(url.searchParams.get('p'), String(part.page));
      assert.ok(part.cid > 0 && part.durationSeconds > 0);
      assert.match(part.thumbnailUrl, /^https:\/\/[a-z0-9.-]+\.hdslb\.com\//);
      assert.ok(!Number.isNaN(Date.parse(part.uploadedAt)));
      const identity = `${part.bvid}:${part.page}:${part.cid}`;
      assert.equal(identities.has(identity), false, identity);
      identities.add(identity);
      assert.ok(['primary', 'collaboration'].includes(part.ownership));
      if (part.ownership === 'collaboration') assert.notEqual(part.owner.uid, 488340243);
    }
  }
});
