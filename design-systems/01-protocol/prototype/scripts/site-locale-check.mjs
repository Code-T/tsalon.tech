import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const root = resolve(existsSync('dist/client/en') ? 'dist/client/en' : 'dist/en');
const files = [];
const walk = (directory) => {
  if (!existsSync(directory)) return;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (/\.(?:html|json|txt)$/.test(entry.name)) files.push(path);
  }
};
walk(root);
if (files.length === 0) throw new Error('No English output found; run a build before checking its language.');

const errors = [];
for (const file of files) {
  const source = readFileSync(file, 'utf8')
    .replaceAll('中文', '')
    .replace(/苏ICP备\d+号-\d+/g, '');
  const matches = source.match(/.{0,36}\p{Script=Han}.{0,36}/gu);
  if (matches) errors.push(`${relative(root, file)}: ${matches.slice(0, 3).join(' | ')}`);
}

if (errors.length) {
  console.error('English output still contains Chinese text:\n' + errors.join('\n'));
  process.exit(1);
}
console.log(`English locale check passed for ${files.length} public files.`);
