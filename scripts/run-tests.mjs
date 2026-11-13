// Прогон тестовых вопросов по роуту ассистента и печать пар вопрос-ответ для ручной проверки.
// node scripts/run-tests.mjs [url] [origin]   (по умолчанию http://localhost:3000/api/chat)
import fs from 'node:fs';

const url = process.argv[2] || 'http://localhost:3000/api/chat';
const origin = process.argv[3] || 'https://svanakov.vercel.app';
const tests = JSON.parse(fs.readFileSync('tests/assistant-questions.json', 'utf8'));

for (const [i, t] of tests.entries()) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify({ messages: [{ role: 'user', content: t.q }], page: t.page }),
  });
  const text = r.ok ? await r.text() : `[HTTP ${r.status}]`;
  console.log(`\n#${i + 1} ${t.q}\nОЖИДАЕТСЯ: ${t.expect}\nОТВЕТ: ${text.trim()}`);
  await new Promise((s) => setTimeout(s, 300));
}
