import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'parse5';

const root = fileURLToPath(new URL('../dist/client/', import.meta.url));
const articleRoots = [join(root, 'articles'), join(root, 'en', 'articles')];
const ignoredTags = new Set(['code', 'pre', 'script', 'style', 'svg']);
const failures = [];
let checked = 0;

function inspect(node, file, inMain = false, ignored = false) {
  const main = inMain || node.tagName === 'main';
  const skip = ignored || ignoredTags.has(node.tagName);
  if (node.nodeName === '#text' && main && !skip && /\*{2,}|_{2,}/.test(node.value)) {
    const excerpt = node.value.replace(/\s+/g, ' ').trim().slice(0, 110);
    failures.push(`${relative(root, file)}: ${excerpt}`);
  }
  for (const child of node.childNodes ?? []) inspect(child, file, main, skip);
}

for (const directory of articleRoots) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = join(directory, entry.name, 'index.html');
    const html = await readFile(file, 'utf8');
    inspect(parse(html), file);
    checked += 1;
  }
}

if (failures.length) {
  console.error(`Unrendered Markdown markers in article pages (${failures.length}):\n${failures.join('\n')}`);
  process.exit(1);
}

console.log(`Visible Markdown marker check passed for ${checked} article pages.`);
