import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { resolve, join, dirname, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

const read = file => readFileSync(resolve(file), 'utf8');
const talks = JSON.parse(read('src/data/talks.json'));
const resources = () => JSON.parse(read('src/data/transcripts.json'));
const importer = resolve('scripts/import-transcripts.mjs');

function fixture(t, parts) {
  const root = mkdtempSync(join(tmpdir(), 'tsalon-transcripts-'));
  t.after(() => {
    assert.equal(dirname(root), resolve(tmpdir()));
    assert.ok(basename(root).startsWith('tsalon-transcripts-'));
    rmSync(root, { recursive: true, force: true });
  });
  mkdirSync(join(root, 'src/data'), { recursive: true });
  mkdirSync(join(root, 'input'));
  writeFileSync(join(root, 'src/data/talks.json'), JSON.stringify([{ id: 'tchat-1', speaker: 'Guest', videoParts: parts }]));
  writeFileSync(join(root, 'src/data/transcripts.json'), '[]\n');
  return {
    root,
    write(stem, overrides = {}, text = '完整测试片段') {
      const metadata = { status: 'complete', full_input_processed: true, review_status: 'unreviewed_asr', model: 'test-asr',
        source_url: 'https://www.bilibili.com/video/BV18Z4y1y7S6?p=1', audio_duration_seconds: 10,
        segment_count: 1, page: 1, cid: 101, finished_at_utc: '2026-09-26T00:00:00+00:00', ...overrides };
      writeFileSync(join(root, 'input', stem + '.json'), JSON.stringify({ metadata, segments: [{ start: 0, end: 10, text }] }));
    },
    run() { return execFileSync(process.execPath, [importer, 'tchat-1', join(root, 'input')], { cwd: root, encoding: 'utf8', stdio: 'pipe' }); },
    registry() { return JSON.parse(readFileSync(join(root, 'src/data/transcripts.json'), 'utf8')); },
    asset(url) { return readFileSync(join(root, 'public', url), 'utf8'); },
  };
}

const baseUrl = 'https://www.bilibili.com/video/BV18Z4y1y7S6';
const part = (page, seconds = 10) => ({ title: `Part ${page}`, url: `${baseUrl}?p=${page}`, durationSeconds: seconds });

test('importer accepts explicit p=1 batch metadata for a canonical single-part URL and writes usable downloads', t => {
  const f = fixture(t, [{ ...part(1), url: baseUrl }]);
  f.write('BV18Z4y1y7S6');
  f.run();
  const [entry] = f.registry();
  assert.equal(entry.videoId, 'BV18Z4y1y7S6');
  assert.equal(entry.page, 1);
  assert.equal(entry.cid, 101);
  assert.equal(entry.method, 'automatic');
  assert.equal(entry.inputKind, 'audio');
  assert.match(f.asset(entry.textUrl), /完整测试片段/);
  assert.match(f.asset(entry.subtitleUrl), /00:00:00,000 --> 00:00:10,000/);
});

test('importer keeps two pages of the same BV distinct in registry, TXT, and SRT files', t => {
  const f = fixture(t, [part(1), part(2)]);
  f.write('BV18Z4y1y7S6-p1', {}, '第一页独有文字');
  f.write('BV18Z4y1y7S6-p2', { source_url: `${baseUrl}?p=2`, page: 2, cid: 202 }, '第二页独有文字');
  f.run();
  const entries = f.registry();
  assert.deepEqual(entries.map(e => [e.videoId, e.page, e.cid]), [['BV18Z4y1y7S6-p1', 1, 101], ['BV18Z4y1y7S6-p2', 2, 202]]);
  assert.notEqual(entries[0].textUrl, entries[1].textUrl);
  assert.match(f.asset(entries[0].textUrl), /第一页独有文字/);
  assert.doesNotMatch(f.asset(entries[0].textUrl), /第二页独有文字/);
  assert.match(f.asset(entries[1].subtitleUrl), /第二页独有文字/);
});

test('importer rejects incomplete, wrong-page, or conflicting-CID metadata before publishing any part', async t => {
  for (const fault of [{ full_input_processed: false }, { page: 1 }, { cid: 101 }, { audio_duration_seconds: 2 }]) {
    await t.test(JSON.stringify(fault), t => {
      const f = fixture(t, [part(1), part(2)]);
      f.write('BV18Z4y1y7S6-p1');
      f.write('BV18Z4y1y7S6-p2', { source_url: `${baseUrl}?p=2`, page: 2, cid: 202, ...fault });
      assert.throws(() => f.run());
      assert.deepEqual(f.registry(), []);
      assert.equal(existsSync(join(f.root, 'public/transcripts/tchat-1')), false);
    });
  }
});

test('source subtitles retain their provenance and missing acquisition time never becomes undefined', t => {
  const f = fixture(t, [part(1)]);
  f.write('BV18Z4y1y7S6', { source_kind: 'bilibili_public_subtitle', review_status: 'unreviewed_source_subtitle',
    full_caption_file_processed: true, source_audio_processed: false, finished_at_utc: undefined });
  f.run();
  const [entry] = f.registry();
  assert.equal(entry.method, 'source-subtitle');
  assert.equal(entry.inputKind, 'subtitle');
  assert.equal(entry.subtitleOrigin, 'unverified');
  assert.equal(entry.sourceAudioProcessed, false);
  assert.equal(entry.fullCaptionFileProcessed, true);
  assert.equal(entry.generatedAt, undefined);
  assert.doesNotMatch(f.asset(entry.textUrl), /undefined|完整音轨自动转录|人工字幕/);
  assert.match(f.asset(entry.textUrl), /来源字幕/);
});

test('automatic-caption evidence and actual acquisition timestamps survive import', t => {
  const f = fixture(t, [{ ...part(1), url: baseUrl }]);
  f.write('BV18Z4y1y7S6', { source_kind: 'automatic_captions', review_status: 'unreviewed_source_subtitle',
    full_caption_file_processed: true, source_audio_processed: false, finished_at_utc: undefined,
    acquired_at_utc: '2026-09-26T01:02:03+00:00' });
  f.run();
  const [entry] = f.registry();
  assert.equal(entry.subtitleOrigin, 'automatic');
  assert.equal(entry.generatedAt, '2026-09-26T01:02:03+00:00');
  assert.match(f.asset(entry.textUrl), /来源自动字幕/);
  assert.doesNotMatch(f.asset(entry.textUrl), /undefined/);
});

test('published transcripts belong to a known full video part and have unique local assets', () => {
  const assets = new Set();
  const sourceKeys = new Set();
  for (const item of resources()) {
    const talk = talks.find(t => t.id === item.talkId);
    assert.ok(talk, item.talkId);
    const part = talk.videoParts.find(p => p.url === item.sourceUrl);
    assert.ok(part, item.sourceUrl);
    assert.ok(Math.abs(part.durationSeconds - item.durationSeconds) < 5, 'full source duration');
    assert.ok(['automatic', 'source-subtitle'].includes(item.method));
    if (item.method === 'source-subtitle') {
      assert.equal(item.inputKind, 'subtitle');
      assert.equal(item.sourceAudioProcessed, false);
      assert.equal(item.fullCaptionFileProcessed, true);
      assert.ok(['automatic', 'unverified'].includes(item.subtitleOrigin));
    }
    assert.ok(item.fullInputProcessed);
    assert.ok(item.segmentCount > 0);
    const source = new URL(item.sourceUrl);
    const bvid = source.pathname.match(/BV[a-zA-Z0-9]{10}/)?.[0];
    const page = Number(source.searchParams.get('p') ?? 1);
    const stem = /^(BV[a-zA-Z0-9]{10})(?:-p([1-9]\d*))?$/.exec(item.videoId);
    assert.ok(stem);
    assert.equal(stem[1], bvid);
    assert.equal(Number(stem[2] ?? 1), page, 'file stem and source refer to the same page');
    if (item.page !== undefined) assert.equal(item.page, page);
    const key = `${bvid}:p${page}`;
    assert.ok(!sourceKeys.has(key), 'duplicate source page');
    sourceKeys.add(key);
    if (item.generatedAt !== undefined) assert.ok(Number.isFinite(Date.parse(item.generatedAt)));
    for (const [key, extension] of [['textUrl', 'txt'], ['subtitleUrl', 'srt']]) {
      assert.match(item[key], new RegExp(`^/transcripts/tchat-\\d+/BV[a-zA-Z0-9]{10}(?:-p[1-9]\\d*)?\\.${extension}$`));
      assert.ok(!assets.has(item[key]), 'duplicate transcript asset');
      assert.equal(item[key], `/transcripts/${item.talkId}/${item.videoId}.${extension}`);
      assets.add(item[key]);
      assert.ok(read('public' + item[key]).trim().length > 0);
    }
  }
});

test('TXT and SRT preserve every segment with valid source timestamps', () => {
  const seconds = stamp => stamp.split(/[:,]/).map(Number).reduce((value, n, i) => i === 3 ? value + n / 1000 : value * 60 + n, 0);
  for (const item of resources()) {
    const text = read('public' + item.textUrl);
    const subtitles = read('public' + item.subtitleUrl);
    assert.ok(text.includes(item.sourceUrl));
    assert.ok(text.includes(item.method === 'source-subtitle' ? '来源' : '自动转录'));
    assert.ok(!text.includes('undefined'));
    assert.ok(!/[A-Z]:\\|model_local_path|source_file/.test(text), 'no local metadata leaks');
    const rows = [...subtitles.matchAll(/^(\d+)\r?\n(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})\r?\n([^\r\n]+)/gm)];
    assert.equal(rows.length, item.segmentCount, item.sourceUrl);
    assert.equal((text.match(/^\[\d{2}:\d{2}:\d{2}\.\d{3} → /gm) ?? []).length, rows.length);
    let previous = 0;
    for (const [index, row] of rows.entries()) {
      const start = seconds(row[2]);
      const end = seconds(row[3]);
      assert.equal(Number(row[1]), index + 1);
      assert.ok(start >= previous && end >= start && end <= item.durationSeconds + 1, row[0]);
      previous = start;
    }
  }
});
