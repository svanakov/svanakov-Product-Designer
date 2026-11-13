// Серверный роут ассистента. Без зависимостей: fetch к OpenAI-совместимому API и Upstash REST.
// Переменные окружения: LLM_BASE_URL, LLM_API_KEY, LLM_MODEL,
// UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, ALLOWED_ORIGINS (через запятую, необязательно)
const crypto = require('node:crypto');
const { PAGES, buildSystemPrompt } = require('./_prompt');

const MAX_MSG_CHARS = 500;
const MAX_MESSAGES = 20;
const KEEP_MESSAGES = 6;
// RL_IP_MAX / RL_DAY_MAX можно временно поднять в Vercel на время прогона тестов.
const IP_LIMIT = { max: Number(process.env.RL_IP_MAX) || 10, windowSec: 600 };
const DAY_LIMIT = { max: Number(process.env.RL_DAY_MAX) || 100, windowSec: 86400 };

const isProd = process.env.VERCEL_ENV === 'production';

function originAllowed(origin) {
  if (!origin) return !isProd; // curl без Origin разрешён только вне production
  const extra = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (extra.includes(origin)) return true;
  if (origin === 'https://svanakov.vercel.app') return true;
  if (/^https:\/\/svanakov[a-z0-9-]*\.vercel\.app$/.test(origin)) return true; // preview-деплои
  if (!isProd && /^http:\/\/localhost(:\d+)?$/.test(origin)) return true;
  return false;
}

// Фиксированное окно в Upstash: INCR + EXPIRE NX. Возвращает true, если лимит не превышен.
async function hit(key, { max, windowSec }) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (isProd) throw new Error('rate limiter is not configured');
    return true; // локальная разработка
  }
  const r = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([['INCR', key], ['EXPIRE', key, String(windowSec), 'NX']]),
  });
  if (!r.ok) throw new Error('rate limiter error');
  const [{ result: count }] = await r.json();
  return count <= max;
}

function send(res, status, code) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: code }));
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 20000) throw new Error('too large');
  }
  return JSON.parse(raw || '{}');
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, 'method_not_allowed');
  if (!originAllowed(req.headers.origin)) return send(res, 403, 'forbidden');

  let body;
  try { body = await readJson(req); } catch { return send(res, 400, 'bad_request'); }

  const msgs = Array.isArray(body.messages) ? body.messages : [];
  const clean = msgs
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MSG_CHARS) }));
  if (!clean.length || clean[clean.length - 1].role !== 'user') return send(res, 400, 'bad_request');
  const page = PAGES.includes(body.page) ? body.page : undefined;

  try {
    const fwd = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
    const ipHash = crypto.createHash('sha256').update(fwd + (process.env.LLM_API_KEY || '')).digest('hex').slice(0, 16);
    const okIp = await hit(`rl:ip:${ipHash}`, IP_LIMIT);
    const okDay = await hit(`rl:day:${new Date().toISOString().slice(0, 10)}`, DAY_LIMIT);
    if (!okIp || !okDay) return send(res, 429, 'rate_limited');
  } catch (e) {
    console.error('limiter', e.message);
    return send(res, 503, 'unavailable');
  }

  let upstream;
  try {
    upstream = await fetch(`${process.env.LLM_BASE_URL.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.LLM_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.LLM_MODEL,
        stream: true,
        temperature: 0.2,
        max_tokens: 400,
        // У DeepSeek thinking включён по умолчанию: для короткого чата он только дороже и медленнее.
        ...(process.env.LLM_DISABLE_THINKING === '1' ? { thinking: { type: 'disabled' } } : {}),
        messages: [{ role: 'system', content: buildSystemPrompt(page) }, ...clean.slice(-KEEP_MESSAGES)],
      }),
    });
  } catch (e) {
    console.error('llm fetch', e.message);
    return send(res, 503, 'unavailable');
  }
  if (!upstream.ok || !upstream.body) {
    console.error('llm status', upstream.status);
    return send(res, 503, 'unavailable');
  }

  // Пробрасываем только текст ответа обычным потоком.
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  const decoder = new TextDecoder();
  let buf = '';
  for await (const chunk of upstream.body) {
    buf += decoder.decode(chunk, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (data === '[DONE]') continue;
      try {
        const delta = JSON.parse(data).choices?.[0]?.delta?.content;
        if (delta) res.write(delta);
      } catch { /* неполный JSON, пропускаем */ }
    }
  }
  res.end();
};
