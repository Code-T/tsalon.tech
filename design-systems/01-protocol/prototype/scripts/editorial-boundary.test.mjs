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
  const recaps = readdirSync('src/content/articles').filter(file => file.startsWith('tchat-') && file.endsWith('-recap.md'));
  assert.equal(recaps.length, 17);
  for (const file of recaps) {
    const source = readFileSync(join('src/content/articles', file), 'utf8');
    assert.doesNotMatch(source, /自动转录|全文转录|转录资源|人工校听|未经嘉宾逐句|TXT|SRT|\/transcripts\//, file);
    assert.match(source, /https:\/\/www\.bilibili\.com\/video\//, file);
  }
});
