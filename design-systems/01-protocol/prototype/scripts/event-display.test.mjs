import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { formatEventDate, formatEventTimeRange, getEventState, getVisibleEventFaq } from '../src/lib/event-display.ts';

test('Shanghai date and 13:30 start do not depend on the build host timezone', () => {
  const moduleUrl = new URL('../src/lib/event-display.ts', import.meta.url).href;
  const script = `import {formatEventDate, formatEventTimeRange} from ${JSON.stringify(moduleUrl)};
    console.log(JSON.stringify({
      time: formatEventTimeRange(new Date('2024-01-13T05:30:00Z'), new Date('2024-01-13T10:00:00Z'), 'Asia/Shanghai'),
      day: formatEventDate(new Date('2026-09-26T16:30:00Z'), 'zh-CN', 'Asia/Shanghai')
    }));`;
  for (const hostZone of ['UTC', 'America/Los_Angeles']) {
    const output = execFileSync(process.execPath, ['--input-type=module', '-e', script], {encoding:'utf8', env:{...process.env, TZ:hostZone}});
    assert.deepEqual(JSON.parse(output), {time:'13:30—18:00', day:'2026/09/27'});
  }
});

test('the event timezone controls the calendar date and time at a day boundary', () => {
  const start = new Date('2026-09-26T05:30:00Z');
  const end = new Date('2026-09-26T06:30:00Z');
  assert.equal(formatEventDate(start, 'zh-CN', 'America/Los_Angeles'), '2026/09/25');
  assert.equal(formatEventTimeRange(start, end, 'America/Los_Angeles'), '22:30—23:30');
  assert.equal(formatEventTimeRange(new Date('2026-09-26T15:30:00Z'), new Date('2026-09-26T16:30:00Z'), 'Asia/Shanghai'), '23:30—2026/09/27 00:30');
  assert.equal(formatEventDate(new Date('2026-12-31T16:30:00Z'), 'en', 'Asia/Shanghai', {year:'numeric'}), '2027');
});

test('ended, archived, closed, and expired registrations never appear open', () => {
  const now = Date.parse('2026-09-26T00:00:00Z');
  const future = new Date('2026-10-01T08:00:00Z');
  for (const [end, registration, expected] of [
    [new Date(now), {status:'open'}, 'ended'],
    [future, {status:'archived'}, 'ended'],
    [future, {status:'closed'}, 'closed'],
    [future, {status:'open', deadline:new Date(now)}, 'closed'],
    [future, {status:'open'}, 'open'],
    [future, {status:'waitlist'}, 'waitlist'],
  ]) {
    const state = getEventState(end, registration, now);
    assert.equal(state.status, expected);
    assert.equal(state.registrationOpen, ['open','waitlist'].includes(expected));
  }
});

test('closed registrations hide attendance instructions but retain historical event facts', () => {
  const faq = [
    {question:'如何报名参加？', answer:'前往报名页面。'},
    {question:'详细地址什么时候能看到？', answer:'报名成功后查看。'},
    {question:'我需要准备什么才能参加？', answer:'带上你的项目。'},
    {question:'这场活动收费吗？名额有多少？', answer:'免费线下活动，上限20人。'},
    {question:'本场讨论了哪些主题？', answer:'跨端与工程实践。'},
    {question:'How can I register?', answer:'Use the registration page.'},
    {question:'What should I prepare to join?', answer:'Bring your AI project.'},
    {question:'When do I get the detailed address?', answer:'After registration.'},
    {question:'How did registration work at the time?', answer:'It was free; the event has ended.'},
  ];
  assert.deepEqual(getVisibleEventFaq(faq, false).map(item => item.question), [faq[3].question, faq[4].question, faq[8].question]);
  assert.deepEqual(getVisibleEventFaq(faq, true), faq);
});
