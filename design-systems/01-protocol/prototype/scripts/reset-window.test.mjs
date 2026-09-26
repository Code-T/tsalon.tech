import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const moduleUrl = new URL('../src/lib/reset-window.ts', import.meta.url);
const windowHelper = await import(moduleUrl.href);

test('no result is offered without an explicit five-hour assumption and valid known start', () => {
  assert.equal(typeof windowHelper.calculateResetWindow, 'function', 'a guarded window calculation must exist');
  for (const [value, confirmed] of [['2026-09-26T23:30', false], ['', true], ['2026-02-30T23:30', true], ['2026-09-26T25:00', true], ['23:30', true]]) {
    assert.equal(windowHelper.calculateResetWindow(value, confirmed), null);
  }
});

test('a known Beijing window start crosses day and year boundaries without host-timezone drift', () => {
  assert.equal(typeof windowHelper.calculateResetWindow, 'function', 'a guarded window calculation must exist');
  const script = `import {calculateResetWindow} from ${JSON.stringify(moduleUrl.href)};
    console.log(JSON.stringify(calculateResetWindow('2026-12-31T23:30', true)));`;
  for (const hostZone of ['UTC', 'America/Los_Angeles', 'Asia/Shanghai']) {
    const output = execFileSync(process.execPath, ['--input-type=module', '-e', script], {encoding:'utf8', env:{...process.env, TZ:hostZone}});
    assert.deepEqual(JSON.parse(output), {endIso:'2026-12-31T20:30:00.000Z', endBeijing:'2027-01-01 04:30'});
  }
});

test('the calculator waits for a button action and clears stale results after an edit', (t) => {
  for (const locale of ['zh', 'en']) {
    const nodes = new Map();
    for (const id of ['codex-window-start', 'codex-calculate', 'codex-calc-result', 'codex-calc-tips']) {
      nodes.set(id, Object.assign(new EventTarget(), {value:'', textContent:''}));
    }
    const originalDocument = globalThis.document;
    globalThis.document = {getElementById: id => nodes.get(id)};
    try {
      windowHelper.initResetWindowCalculator('codex', locale);
      const input = nodes.get('codex-window-start');
      const button = nodes.get('codex-calculate');
      const result = nodes.get('codex-calc-result');
      assert.equal(input.value, '');
      assert.equal(result.textContent, '—');
      input.value = '2026-09-26T23:30';
      input.dispatchEvent(new Event('input'));
      assert.equal(result.textContent, '—');
      button.dispatchEvent(new Event('click'));
      assert.equal(result.textContent, '2026-09-27 04:30');
      input.value = '';
      input.dispatchEvent(new Event('input'));
      assert.equal(result.textContent, '—');
      button.dispatchEvent(new Event('click'));
      assert.equal(result.textContent, '—');
    } finally {
      if (originalDocument === undefined) delete globalThis.document;
      else globalThis.document = originalDocument;
    }
  }
});
