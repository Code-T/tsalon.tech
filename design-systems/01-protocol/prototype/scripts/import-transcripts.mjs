import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const [talkId, sourceDirectory] = process.argv.slice(2);
if (!talkId || !sourceDirectory) throw new Error('Usage: node scripts/import-transcripts.mjs <talk-id> <completed-json-directory>');
const talks = JSON.parse(readFileSync('src/data/talks.json', 'utf8'));
const talk = talks.find(item => item.id === talkId);
assert.ok(talk && /^tchat-\d+$/.test(talkId), 'Unknown talk');
const manifestPath = 'src/data/transcripts.json';
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const sourceIdentity = value => {
  const url = new URL(value);
  assert.ok(url.protocol === 'https:' && ['www.bilibili.com', 'bilibili.com'].includes(url.hostname), 'Expected a public Bilibili source URL');
  const bvid = /^\/video\/(BV[a-zA-Z0-9]{10})\/?$/.exec(url.pathname)?.[1];
  const pageValue = url.searchParams.get('p');
  assert.ok(bvid && url.searchParams.getAll('p').length <= 1 && (pageValue === null || /^[1-9]\d*$/.test(pageValue)), 'Invalid BV/page source');
  const page = Number(pageValue ?? 1);
  assert.ok(Number.isSafeInteger(page));
  return { bvid, page, explicitPage: pageValue !== null, key: `${bvid}:p${page}` };
};
const sources = talk.videoParts.map(part => sourceIdentity(part.url));
const sourceKeys = new Set();
const cids = new Set();
const stamp = (time, separator = '.') => {
  let ms = Math.round(time * 1000);
  const hours = Math.floor(ms / 3600000); ms %= 3600000;
  const minutes = Math.floor(ms / 60000); ms %= 60000;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(Math.floor(ms / 1000)).padStart(2, '0')}${separator}${String(ms % 1000).padStart(3, '0')}`;
};

// Validate every part before writing any public file: a partial episode must not claim completeness.
const prepared = talk.videoParts.map((part, index) => {
  const source = sources[index];
  const multiplePages = sources.filter(item => item.bvid === source.bvid).length > 1;
  const videoId = source.bvid + (source.explicitPage ? `-p${source.page}` : '');
  // The batch uses BV.json for single-page archives, even with an explicit ?p=1 URL.
  const sourceKey = multiplePages || source.page > 1 ? `${source.bvid}-p${source.page}` : source.bvid;
  let inputPath = join(resolve(sourceDirectory), sourceKey + '.json');
  if (!existsSync(inputPath) && !multiplePages && source.page === 1 && source.explicitPage) {
    inputPath = join(resolve(sourceDirectory), videoId + '.json');
  }
  const { metadata: meta, segments } = JSON.parse(readFileSync(inputPath, 'utf8'));
  assert.equal(sourceIdentity(meta.source_url).key, source.key, 'Source BV/page mismatch');
  assert.ok(!sourceKeys.has(source.key), 'Duplicate source BV/page');
  sourceKeys.add(source.key);
  if (meta.page !== undefined) assert.equal(meta.page, source.page, 'Metadata page mismatch');
  if (multiplePages || source.page > 1) assert.ok(Number.isSafeInteger(meta.cid) && meta.cid > 0, 'Multi-page transcripts require a CID');
  if (meta.cid !== undefined) {
    assert.ok(Number.isSafeInteger(meta.cid) && meta.cid > 0, 'Invalid CID');
    assert.ok(!cids.has(meta.cid), 'Conflicting CID across different video parts');
    cids.add(meta.cid);
  }
  assert.equal(meta.status, 'complete');
  assert.equal(meta.full_input_processed, true);
  assert.ok(Number.isFinite(meta.audio_duration_seconds) && meta.audio_duration_seconds > 0);
  assert.ok(Math.abs(meta.audio_duration_seconds - part.durationSeconds) < 5, 'Truncated or wrong audio');
  const subtitleKinds = ['bilibili_public_subtitle', 'subtitles', 'automatic_captions'];
  const isSourceSubtitle = subtitleKinds.includes(meta.source_kind);
  assert.ok(meta.source_kind === undefined || isSourceSubtitle, 'Unknown transcript provenance');
  if (isSourceSubtitle) {
    assert.equal(meta.full_caption_file_processed, true, 'The complete source subtitle file must be processed');
    assert.notEqual(meta.source_audio_processed, true, 'Source subtitles are not full-audio ASR');
  } else {
    assert.ok(typeof meta.model === 'string' && meta.model.trim(), 'ASR model evidence is required');
  }
  const subtitleOrigin = meta.source_kind === 'automatic_captions' ? 'automatic' : 'unverified';
  const method = isSourceSubtitle ? 'source-subtitle' : 'automatic';
  const inputKind = isSourceSubtitle ? 'subtitle' : 'audio';
  const generatedAt = meta.finished_at_utc ?? meta.acquired_at_utc;
  if (generatedAt !== undefined) assert.ok(typeof generatedAt === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(generatedAt) && Number.isFinite(Date.parse(generatedAt)), 'Invalid actual completion/acquisition time');
  assert.ok(Array.isArray(segments) && segments.length > 0);
  assert.equal(segments.length, meta.segment_count);
  let previous = 0;
  for (const row of segments) {
    assert.ok(Number.isFinite(row.start) && Number.isFinite(row.end));
    assert.ok(row.start >= previous && row.end >= row.start && row.end <= meta.audio_duration_seconds + 1);
    assert.ok(typeof row.text === 'string' && row.text.trim());
    previous = row.start;
  }
  const textUrl = `/transcripts/${talkId}/${videoId}.txt`;
  const subtitleUrl = `/transcripts/${talkId}/${videoId}.srt`;
  const provenance = isSourceSubtitle
    ? `${subtitleOrigin === 'automatic' ? '来源自动字幕' : '来源字幕（生成方式未核实）'}，已读取完整字幕文件；字幕覆盖范围以原片为准，未以音轨 ASR 补全。`
    : '完整音轨自动转录';
  const timeLine = generatedAt ? `${isSourceSubtitle ? '字幕取得/处理完成' : '转录完成'}：${generatedAt}\n` : '';
  const heading = `${talk.speaker} · ${part.title}\n${provenance}，未经逐句人工校听；说话人未自动标注，专名和个别语句可能有误。\n来源：${part.url}\n录播时长：${stamp(meta.audio_duration_seconds)}\n${timeLine}\n`;
  const text = heading + segments.map(row => `[${stamp(row.start)} → ${stamp(row.end)}] ${row.text.trim().replace(/[\r\n]+/g, ' ')}`).join('\n') + '\n';
  const srt = segments.map((row, index) => `${index + 1}\n${stamp(row.start, ',')} --> ${stamp(row.end, ',')}\n${row.text.trim().replace(/[\r\n]+/g, ' ')}`).join('\n\n') + '\n';
  const entry = {talkId, videoId, page:source.page, ...(meta.cid !== undefined ? {cid:meta.cid} : {}), title:part.title, sourceUrl:part.url,
    durationSeconds:meta.audio_duration_seconds, method, inputKind, sourceAudioProcessed:!isSourceSubtitle,
    ...(isSourceSubtitle ? {sourceKind:meta.source_kind, subtitleOrigin, fullCaptionFileProcessed:true} : {}),
    fullInputProcessed:true, segmentCount:segments.length, ...(generatedAt ? {generatedAt} : {}), textUrl, subtitleUrl};
  return {entry, text, srt};
});
mkdirSync(resolve('public/transcripts', talkId), {recursive:true});
for (const item of prepared) {
  writeFileSync(resolve('public' + item.entry.textUrl), item.text, 'utf8');
  writeFileSync(resolve('public' + item.entry.subtitleUrl), item.srt, 'utf8');
}
const next = [...manifest.filter(item => item.talkId !== talkId), ...prepared.map(item => item.entry)];
writeFileSync(manifestPath, JSON.stringify(next, null, 2) + '\n');
console.log(`Imported ${prepared.length} complete transcript parts for ${talkId}.`);
