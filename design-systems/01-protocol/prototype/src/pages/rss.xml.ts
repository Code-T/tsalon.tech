import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export const GET: APIRoute = async ({ site }) => {
  const origin = site?.origin ?? 'https://www.tsalon.tech';
  const articles = (await getCollection('articles', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime(),
  );

  const recordings = await getCollection('recordings');
  const feedEntries = [
    ...articles.map(entry => ({ title: entry.data.title, summary: entry.data.summary, date: entry.data.publishedAt, topics: entry.data.topics, url: `${origin}/articles/${entry.id}/` })),
    ...recordings.map(entry => ({ title: `视频档案｜${entry.data.title}`, summary: entry.data.summary, date: new Date(entry.data.uploadedAt), topics: entry.data.topics, url: `${origin}/recordings/${entry.id}/` })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const items = feedEntries
    .map((entry) => {
      const url = entry.url;
      return [
        '    <item>',
        `      <title>${escapeXml(entry.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <pubDate>${entry.date.toUTCString()}</pubDate>`,
        `      <description>${escapeXml(entry.summary)}</description>`,
        `      <category>${escapeXml(entry.topics.join('、'))}</category>`,
        '    </item>',
      ].join('\n');
    })
    .join('\n');

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    '    <title>T Salon</title>',
    `    <link>${origin}/</link>`,
    `    <atom:link href="${origin}/rss.xml" rel="self" type="application/rss+xml" />`,
    '    <description>T Salon 面向开发者的线上与线下技术交流平台，发布活动回顾、嘉宾访谈与技术观察，覆盖 Apple 开发者生态、AI 与软件工程实践。</description>',
    '    <language>zh-CN</language>',
    '    <managingEditor>editorial@tsalon.tech (T Salon Editorial Team)</managingEditor>',
    `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
    items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');

  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
