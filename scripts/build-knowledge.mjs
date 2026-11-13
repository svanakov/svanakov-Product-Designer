// Склеивает content/assistant/**/*.md в api/_knowledge.js (CommonJS-строка).
// Запуск: node scripts/build-knowledge.mjs  (после каждой правки базы)
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('content/assistant');
const order = ['about.md', 'experience.md', 'cases', 'skills.md', 'faq.md', 'boundaries.md', 'links.md'];

function collect(p) {
  const full = path.join(root, p);
  if (fs.statSync(full).isDirectory()) {
    return fs.readdirSync(full).sort().flatMap((f) => collect(path.join(p, f)));
  }
  return [p];
}

const files = order.flatMap(collect);
const text = files
  .map((f) => {
    const body = fs.readFileSync(path.join(root, f), 'utf8').replace(/<!--[\s\S]*?-->/g, '').trim();
    return `=== ${f} ===\n${body}`;
  })
  .join('\n\n');

fs.writeFileSync('api/_knowledge.js', `// Сгенерировано scripts/build-knowledge.mjs. Не править руками.\nmodule.exports = ${JSON.stringify(text)};\n`);
console.log(`files: ${files.length}, chars: ${text.length}, ~tokens: ${Math.round(text.length / 2.5)}`);
