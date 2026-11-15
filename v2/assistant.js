// Встроенный блок ИИ-ассистента для v2. Живёт только в #assistant, без всплывающих окон и плавающих кнопок.
// Бэкенд тот же: POST /api/chat (потоковый текст). Закрытый режим: см. PUBLIC и ключ в site.js.
import { getLang, ASSISTANT_KEY, PUBLIC } from './site.js';

const API = '/api/chat';
const TG = 'https://t.me/svanakov';
const MAX_QUESTIONS = 10;
const CASE_URLS = { rytmo: './rytmo.html', campus: './campus.html', dispatch: './dispatch.html' };

const T = {
  ru: {
    title: 'Спросите о Сергее', preview: 'Предпросмотр, виден только вам', placeholder: 'Ваш вопрос', send: 'Отправить', stop: 'Стоп',
    hint: 'ИИ может ошибаться. Точные ответы у Сергея в Telegram.',
    errorTitle: 'Ассистент сейчас недоступен.', limitTitle: 'На этом вопросов в одном чате достаточно.',
    tgBtn: 'Открыть Telegram', contact: 'Спросить Сергея в Telegram', thinking: 'Думаю',
    cases: { rytmo: 'Открыть кейс Rytmo', campus: 'Открыть кейс Campus', dispatch: 'Открыть кейс «Диспетчерская консоль»' },
    chips: ['Какой опыт в EdTech?', 'Расскажи про самый сложный проект', 'Как Сергей проводит исследования?', 'Работает ли удалённо?'],
  },
  en: {
    title: 'Ask about Sergey', preview: 'Private preview, visible only to you', placeholder: 'Your question', send: 'Send', stop: 'Stop',
    hint: 'AI can make mistakes. For exact answers, ask Sergey on Telegram.',
    errorTitle: 'The assistant is unavailable right now.', limitTitle: 'That is enough questions for one chat.',
    tgBtn: 'Open Telegram', contact: 'Ask Sergey on Telegram', thinking: 'Thinking',
    cases: { rytmo: 'Open the Rytmo case', campus: 'Open the Campus case', dispatch: 'Open the Dispatcher Console case' },
    chips: ['What is Sergey’s experience in EdTech?', 'Tell me about the hardest project', 'How does Sergey do research?', 'Does he work remotely?'],
  },
};

const stripMarkers = (t) => t.replace(/\[\[[^\]]*\]\]/g, '').replace(/\[\[[^\]]*$/, '').replace(/\[$/, '').trim();
const markers = (t) => { const out = []; t.replace(/\[\[([^\]]+)\]\]/g, (m, k) => { if (!out.includes(k)) out.push(k); return m; }); return out; };
function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

export function mountAssistant(root) {
  let history = [];
  try { history = JSON.parse(sessionStorage.getItem('asst_chat') || '[]'); } catch {}
  const save = () => { try { sessionStorage.setItem('asst_chat', JSON.stringify(history)); } catch {} };
  let busy = false, ctrl = null;
  const L = () => T[getLang()];

  root.innerHTML = `
    <section class="asst" aria-labelledby="asst-title">
      <div class="asst__head"><div><div class="asst__title" id="asst-title"></div><div class="asst__sub"></div></div></div>
      <div class="asst__log" role="log" aria-live="polite"></div>
      <form class="asst__form">
        <input class="asst__input" type="text" maxlength="500" autocomplete="off">
        <button class="asst__send" type="submit"></button>
      </form>
      <div class="asst__hint"></div>
    </section>`;
  const $ = (s) => root.querySelector(s);
  const log = $('.asst__log'), input = $('.asst__input'), sendBtn = $('.asst__send'), form = $('.asst__form');

  const scrollDown = () => { log.scrollTop = log.scrollHeight; }; // прокручиваем только ленту, страница не двигается
  const asked = () => history.filter((m) => m.role === 'user').length;

  function actionLinks(text) {
    const box = el('div', 'asst__actions');
    markers(text).forEach((m) => {
      const a = el('a', 'asst__link'); a.rel = 'noopener';
      if (m === 'contact') { a.href = TG; a.target = '_blank'; a.textContent = L().contact; box.appendChild(a); }
      else if (m.startsWith('case:') && CASE_URLS[m.slice(5)]) { a.href = CASE_URLS[m.slice(5)]; a.textContent = L().cases[m.slice(5)]; box.appendChild(a); }
    });
    return box.children.length ? box : null;
  }
  function addMsg(role, text) {
    const m = el('div', 'asst__msg ' + (role === 'user' ? 'is-user' : 'is-bot'));
    m.textContent = role === 'user' ? text : stripMarkers(text);
    log.appendChild(m);
    if (role !== 'user') { const a = actionLinks(text); if (a) m.appendChild(a); }
    return m;
  }
  function tgCard(title) {
    const c = el('div', 'asst__card'); c.appendChild(el('div', null, title));
    const a = el('a', 'asst__link', L().tgBtn); a.href = TG; a.target = '_blank'; a.rel = 'noopener';
    const w = el('div', 'asst__actions'); w.appendChild(a); c.appendChild(w);
    return c;
  }
  function setBusy(v) {
    busy = v; sendBtn.textContent = v ? L().stop : L().send; sendBtn.type = v ? 'button' : 'submit'; input.disabled = v;
  }
  function lockIfLimit() {
    if (asked() < MAX_QUESTIONS) return false;
    input.disabled = true; sendBtn.disabled = true;
    if (!log.querySelector('.is-limit')) { const c = tgCard(L().limitTitle); c.classList.add('is-limit'); log.appendChild(c); scrollDown(); }
    return true;
  }

  function render() {
    const l = L();
    $('.asst__title').textContent = l.title;
    const sub = $('.asst__sub'); sub.textContent = PUBLIC ? '' : l.preview; sub.hidden = PUBLIC;
    input.placeholder = l.placeholder; input.setAttribute('aria-label', l.placeholder);
    $('.asst__hint').textContent = l.hint;
    if (!busy) sendBtn.textContent = l.send;
    if (busy) return; // не пересобираем ленту во время ответа
    log.textContent = '';
    if (!history.length) {
      const chips = el('div', 'asst__chips');
      l.chips.forEach((q, i) => {
        const b = el('button', 'asst__chip', q); b.type = 'button'; b.style.setProperty('--i', i);
        b.addEventListener('click', () => ask(q));
        chips.appendChild(b);
      });
      log.appendChild(chips);
    } else history.forEach((m) => addMsg(m.role, m.content));
    lockIfLimit(); scrollDown();
  }

  async function ask(question) {
    question = (question || '').trim();
    if (!question || busy || lockIfLimit()) return;
    const chips = log.querySelector('.asst__chips'); if (chips) chips.remove();
    history.push({ role: 'user', content: question }); save();
    addMsg('user', question); input.value = '';
    const bot = el('div', 'asst__msg is-bot is-pending');
    bot.setAttribute('aria-label', L().thinking);
    bot.innerHTML = '<span class="asst__dots" aria-hidden="true"><i></i><i></i><i></i></span>';
    log.appendChild(bot); scrollDown(); setBusy(true);
    ctrl = new AbortController();
    let answer = '';
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (ASSISTANT_KEY) headers['x-assistant-key'] = ASSISTANT_KEY;
      const r = await fetch(API, { method: 'POST', headers, signal: ctrl.signal, body: JSON.stringify({ messages: history, page: 'home' }) });
      if (!r.ok || !r.body) throw new Error('http ' + r.status);
      const reader = r.body.getReader(), dec = new TextDecoder();
      for (;;) {
        const s = await reader.read(); if (s.done) break;
        answer += dec.decode(s.value, { stream: true });
        bot.classList.remove('is-pending'); bot.textContent = stripMarkers(answer); scrollDown();
      }
    } catch (e) {
      if (e.name !== 'AbortError' && !answer) {
        bot.remove(); history.pop(); save(); log.appendChild(tgCard(L().errorTitle)); scrollDown(); setBusy(false); return;
      }
    }
    if (answer) {
      bot.classList.remove('is-pending'); bot.textContent = stripMarkers(answer);
      const a = actionLinks(answer); if (a) bot.appendChild(a);
      history.push({ role: 'assistant', content: answer });
    } else { bot.remove(); history.pop(); }
    save(); setBusy(false);
    if (!lockIfLimit()) input.focus({ preventScroll: true });
    scrollDown();
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); ask(input.value); });
  sendBtn.addEventListener('click', () => { if (busy && ctrl) ctrl.abort(); });
  document.addEventListener('langchange', render);
  render();
  return { focus: () => input.focus({ preventScroll: true }) };
}
