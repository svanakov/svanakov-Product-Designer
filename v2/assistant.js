// Встроенный блок ИИ-ассистента для v2. Живёт только в #assistant, без всплывающих окон и плавающих кнопок.
// Бэкенд тот же: POST /api/chat (потоковый текст). Закрытый режим: см. PUBLIC и ключ в site.js.
import { getLang, pick, ASSISTANT_KEY, PUBLIC } from './site.js';
import { createSprite } from './pet-sprite.js';

const API = '/api/chat';
const TG = 'https://t.me/babyoslik';
const MAX_QUESTIONS = 6;

// Дневной лимит вопросов: счётчик лежит в localStorage и переживает перезагрузку страницы.
// Окно 24 часа считается от первого вопроса; по истечении счётчик обнуляется. (Это защита от случайного «перезагрузил и спросил снова»,
// настоящий лимит всё равно считает сервер: у клиентского счётчика обход тривиален.)
const QUOTA_KEY = 'ai_quota', DAY_MS = 24 * 60 * 60 * 1000;
// У владельца (открыл сайт с ключом) лимита и счётчика нет.
const OWNER = !!ASSISTANT_KEY;
function quotaRead() {
  if (OWNER) return { count: 0, since: Date.now() };
  try { const q = JSON.parse(localStorage.getItem(QUOTA_KEY) || 'null'); if (q && typeof q.count === 'number' && Date.now() - q.since < DAY_MS) return q; } catch {}
  return { count: 0, since: Date.now() };
}
function quotaBump() {
  if (OWNER) return { count: 0, since: Date.now() };
  const q = quotaRead(); if (q.count === 0) q.since = Date.now(); q.count++;
  try { localStorage.setItem(QUOTA_KEY, JSON.stringify(q)); } catch {}
  return q;
}
const quotaHoursLeft = () => { const q = quotaRead(); return Math.max(1, Math.ceil((q.since + DAY_MS - Date.now()) / 3600000)); };
const CASE_URLS = { rytmo: './rytmo.html', campus: './campus.html', dispatch: './dispatch.html' };

const T = {
  ru: {
    title: 'Спросите о Сергее', preview: 'Предпросмотр, виден только вам', placeholder: 'Ваш вопрос', send: 'Отправить', stop: 'Стоп',
    hint: 'ИИ может ошибаться. Точные ответы у Сергея в Telegram.',
    errorTitle: 'Ассистент сейчас недоступен.', limitTitle: 'На сегодня вопросов достаточно.',
    tgBtn: 'Открыть Telegram', contact: 'Спросить Сергея в Telegram', thinking: 'Думаю...',
    cases: { rytmo: 'Открыть кейс Rytmo', campus: 'Открыть кейс Campus', dispatch: 'Открыть кейс «Диспетчерская консоль»' },
    chips: ['Какой опыт в EdTech?', 'Расскажи про самый сложный проект', 'Как Сергей проводит исследования?', 'Работает ли удалённо?'],
  },
  en: {
    title: 'Ask about Sergei', preview: 'Private preview, visible only to you', placeholder: 'Your question', send: 'Send', stop: 'Stop',
    hint: 'AI can make mistakes. For exact answers, ask Sergei on Telegram.',
    errorTitle: 'The assistant is unavailable right now.', limitTitle: 'That is enough questions for today.',
    tgBtn: 'Open Telegram', contact: 'Ask Sergei on Telegram', thinking: 'Thinking...',
    cases: { rytmo: 'Open the Rytmo case', campus: 'Open the Campus case', dispatch: 'Open the Dispatcher Console case' },
    chips: ['What is Sergei’s experience in EdTech?', 'Tell me about the hardest project', 'How does Sergei do research?', 'Does he work remotely?'],
  },
};

const stripMarkers = (t) => t.replace(/\[\[[^\]]*\]\]/g, '').replace(/\[\[[^\]]*$/, '').replace(/\[$/, '').trim();
const markers = (t) => { const out = []; t.replace(/\[\[([^\]]+)\]\]/g, (m, k) => { if (!out.includes(k)) out.push(k); return m; }); return out; };
function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

// Потоковый вывод текста «как в ChatGPT»: куски ответа складываются в очередь, слова выходят ровным темпом,
// каждое проявляется из размытия (анимация .ai__w), в конце текста мигает курсор.
// update(текст целиком, final): незавершённое последнее слово придерживается до пробела; onDone: всё выведено; skip: показать остаток сразу.
function createWordStream(el, onGrow) {
  const queue = []; let shown = 0, timer = 0, final = false, doneCb = null, last = '';
  const append = (tok) => {
    if (/^\s+$/.test(tok)) { el.appendChild(document.createTextNode(tok)); return; }
    const w = document.createElement('span'); w.className = 'ai__w'; w.textContent = tok; el.appendChild(w);
  };
  const caret = () => { const c = el.querySelector('.ai__caret'); if (c) c.remove(); if (!final || queue.length) el.insertAdjacentHTML('beforeend', '<span class="ai__caret"></span>'); };
  const tick = () => {
    timer = 0;
    const n = queue.length > 70 ? 4 : queue.length > 30 ? 2 : 1; // если модель опережает, подтягиваемся
    for (let k = 0; k < n && queue.length; k++) { last = queue.shift(); append(last); }
    caret(); if (onGrow) onGrow();
    if (queue.length) { timer = setTimeout(tick, 26 + Math.random() * 34 + (/[.!?]$/.test(last) ? 170 : /[,;:]$/.test(last) ? 70 : 0)); }
    else if (final) { const c = el.querySelector('.ai__caret'); if (c) c.remove(); if (doneCb) doneCb(); }
  };
  return {
    update(text, isFinal) {
      final = !!isFinal;
      let avail = text;
      if (!final && !/\s$/.test(text)) avail = text.slice(0, Math.max(shown, text.search(/\S+$/))); // последнее слово ещё может дописываться
      if (avail.length > shown) { queue.push(...(avail.slice(shown).match(/\s+|\S+/g) || [])); shown = avail.length; }
      if (reduce()) { while (queue.length) append(queue.shift()); caret(); if (final) { const c = el.querySelector('.ai__caret'); if (c) c.remove(); if (doneCb) doneCb(); } return; }
      if (!timer) tick();
    },
    onDone(cb) { doneCb = cb; },
    skip() { clearTimeout(timer); timer = 0; while (queue.length) append(queue.shift()); const c = el.querySelector('.ai__caret'); if (c) c.remove(); },
  };
}

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
    if (quotaRead().count < MAX_QUESTIONS) return false;
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
    history.push({ role: 'user', content: question }); save(); quotaBump();
    addMsg('user', question); input.value = '';
    const bot = el('div', 'asst__msg is-bot is-pending');
    bot.setAttribute('aria-label', L().thinking);
    bot.innerHTML = `<span class="ai__think">${L().thinking}</span>`;
    log.appendChild(bot); scrollDown(); setBusy(true);
    ctrl = new AbortController();
    let answer = '', stream = null;
    const ensureStream = () => { if (!stream) { bot.classList.remove('is-pending'); bot.textContent = ''; stream = createWordStream(bot, scrollDown); } return stream; };
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (ASSISTANT_KEY) headers['x-assistant-key'] = ASSISTANT_KEY;
      const r = await fetch(API, { method: 'POST', headers, signal: ctrl.signal, body: JSON.stringify({ messages: history, page: 'home' }) });
      if (!r.ok || !r.body) throw new Error('http ' + r.status);
      const reader = r.body.getReader(), dec = new TextDecoder();
      for (;;) {
        const s = await reader.read(); if (s.done) break;
        answer += dec.decode(s.value, { stream: true });
        ensureStream().update(stripMarkers(answer), false);
      }
    } catch (e) {
      if (e.name === 'AbortError' && stream) stream.skip();
      if (e.name !== 'AbortError' && !answer) {
        bot.remove(); history.pop(); save(); log.appendChild(tgCard(L().errorTitle)); scrollDown(); setBusy(false); return;
      }
    }
    if (answer) {
      // дожидаемся, пока очередь слов выведется до конца, и только потом добавляем кнопки-ссылки
      await new Promise((res) => { const s = ensureStream(); s.onDone(res); s.update(stripMarkers(answer), true); });
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

// ---------- Демо-ассистент: полноценный интерфейс на заготовленных ответах (без запросов к серверу) ----------
// Тексты ответов взяты только из кейсов и CV. Настоящий ассистент включается флагом ASSISTANT_LIVE в home.js.
const CASES = {
  rytmo: { href: './rytmo.html', cover: '../uploads/rytmo-cover5.webp', title: { ru: 'Rytmo', en: 'Rytmo' }, sub: { ru: 'Мобильное приложение', en: 'Mobile app' } },
  campus: { href: './campus.html', cover: '../uploads/campus-cover5.webp', title: { ru: 'Campus', en: 'Campus' }, sub: { ru: 'Веб, PWA', en: 'Web, PWA' } },
  dispatch: { href: './dispatch.html', cover: '../uploads/dispatch-cover5.webp', title: { ru: 'Диспетчерская консоль', en: 'Dispatcher Console' }, sub: { ru: 'Веб, B2B', en: 'Web, B2B' } },
};
const DEMO = {
  edtech: { q: { ru: 'Какой опыт в EdTech?', en: 'What is his EdTech experience?' }, card: 'campus', follow: ['metrics', 'campus', 'tools'], keys: /edtech|образован|дэш|dash|учител|teacher/i,
    a: { ru: 'В EdTech Сергей работал над платформой «Дэш» для учителей (сен 2025 – июн 2026): спроектировал ключевые сценарии, от генерации теста до проверки и аналитики по классу, и собрал дизайн-систему. Ещё он сам сделал Campus, PWA с расписанием вуза.',
         en: 'In EdTech Sergei worked on “Dash”, a platform for teachers (Sep 2025 – Jun 2026): he designed the key flows, from test generation to grading and class analytics, and built the design system. He also made Campus, a university schedule PWA, on his own.' } },
  hardest: { q: { ru: 'Расскажи про самый сложный проект', en: 'Tell me about the hardest project' }, card: 'dispatch', follow: ['research', 'rytmo', 'remote'], keys: /сложн|dispatch|диспетч|hardest|console/i,
    a: { ru: 'Пожалуй, диспетчерская консоль курьерской компании. При 100+ заказах в день таблица не справляется, а срывы SLA замечают постфактум. Сергей разобрал процесс диспетчера, выделил семь задач и спроектировал модель данных, дизайн-систему и интерфейс.',
         en: 'Probably the dispatcher console for a courier company. At 100+ orders a day a spreadsheet cannot keep up, and SLA breaches are noticed too late. Sergei mapped the dispatcher’s process, defined seven jobs and designed the data model, design system and interface.' } },
  research: { q: { ru: 'Как Сергей проводит исследования?', en: 'How does Sergei do research?' }, card: 'rytmo', follow: ['hardest', 'tools', 'metrics'], keys: /исслед|интервью|jtbd|research|interview/i,
    a: { ru: 'Начинает с деск-ресерча, затем глубинные интервью и JTBD, гипотезы приоритизирует через ICE, а прототип проверяет юзабилити-тестом. В Rytmo на тесте с 12 участниками 11 (92%) первым кликом попали на рекомендуемую тренировку.',
         en: 'He starts with desk research, then in-depth interviews and JTBD, prioritizes hypotheses with ICE and checks the prototype with a usability test. In Rytmo, 11 of 12 participants (92%) landed on the recommended workout with their first click.' } },
  remote: { q: { ru: 'Работает ли удалённо?', en: 'Does he work remotely?' }, card: 'contact', follow: ['edtech', 'metrics', 'tools'], keys: /удал|тула|локац|remote|where|location|зарплат|salary/i,
    a: { ru: 'Сергей живёт в Туле и работает удалённо. Сейчас он ищет full-time позицию в продуктовой команде. Про формат, сроки и зарплату лучше спросить его напрямую.',
         en: 'Sergei lives in Tula and works remotely. He is looking for a full-time role in a product team. For format, timing and salary it is best to ask him directly.' } },
  metrics: { q: { ru: 'Каких результатов он добивался?', en: 'What results has he achieved?' }, card: null, follow: ['edtech', 'research', 'hardest'], keys: /результат|конверс|метрик|цифр|result|metric|conversion/i,
    a: { ru: 'В магазине автозапчастей «Би-Би» он поднял конверсию в покупку на 20% и сократил время поиска товара на 27%. В «Правильной стоматологии» вместе с командой поднял конверсию в заявку с 1,2% до 3,8%, сократив форму записи с восьми полей до двух.',
         en: 'At the auto parts store “Bi-Bi” he raised purchase conversion by 20% and cut product search time by 27%. At “Pravilnaya Stomatologiya” he and the team raised lead conversion from 1.2% to 3.8% by cutting the booking form from eight fields to two.' } },
  tools: { q: { ru: 'Какие инструменты использует?', en: 'Which tools does he use?' }, card: null, follow: ['research', 'campus', 'remote'], keys: /инструмент|figma|стек|tools|stack/i,
    a: { ru: 'Figma и Figma AI, Tilda, HTML/CSS. Сайт портфолио собран с Claude. Из методов: глубинные интервью, юзабилити-тесты, A/B, CJM, JTBD, анализ конкурентов и Яндекс Метрика.',
         en: 'Figma and Figma AI, Tilda, HTML/CSS. The portfolio site was built with Claude. Methods: in-depth interviews, usability tests, A/B, CJM, JTBD, competitor analysis and Yandex Metrika.' } },
  rytmo: { q: { ru: 'Расскажи про Rytmo', en: 'Tell me about Rytmo' }, card: 'rytmo', follow: ['research', 'hardest', 'tools'], keys: /rytmo|ритмо|фитнес|fitness/i,
    a: { ru: 'Rytmo — мобильное фитнес-приложение. Люди бросают тренировки на 2–3 неделе, до появления привычки, и Сергей искал, как удержать их в этот период: провёл интервью, собрал JTBD, проверил кликабельный прототип на 12 людях.',
         en: 'Rytmo is a mobile fitness app. People quit working out in week 2–3, before the habit forms, and Sergei looked for ways to keep them through that period: he ran interviews, built JTBD and tested a clickable prototype with 12 people.' } },
  campus: { q: { ru: 'Почему Campus сделан как PWA?', en: 'Why is Campus a PWA?' }, card: 'campus', follow: ['edtech', 'tools', 'hardest'], keys: /campus|кампус|pwa|расписан/i,
    a: { ru: 'Аудитория небольшая: сам Сергей и одногруппники, поэтому сторы и поддержка двух платформ не нужны. PWA работает офлайн через service worker и ставится в один клик, а официальное приложение вуза вылетало и без интернета не открывалось.',
         en: 'The audience is small: Sergei himself and his classmates, so app stores and two native platforms are unnecessary. A PWA works offline through a service worker and installs in one tap, while the official university app crashed and would not open offline.' } },
};
const DEMO_FALLBACK = {
  ru: 'Пока я отвечаю только на вопросы из подсказок. Всё остальное лучше спросить у Сергея в Telegram.',
  en: 'For now I only answer the suggested questions. Everything else is best asked to Sergei on Telegram.',
};
const DEMO_UI = {
  ru: { title: 'Облачно', badge: 'Бета-версия', tip: 'Количество вопросов ограничено: в сутки можно задать 6', hello: 'Привет, я ИИ-ассистент Сергея. Расскажу про его кейсы и опыт. Напишите свой вопрос или выберите из подсказок.',
        surprise: 'Удиви меня', send: 'Отправить', stop: 'Стоп', left: 'вопросов осталось', limit: 'На сегодня вопросов достаточно. Остальное лучше обсудить с Сергеем.', resets: 'Новые вопросы можно будет задать через {h} ч.',
        tg: 'Написать в Telegram', placeholder: 'Ваш вопрос' },
  en: { title: 'Cloudy', badge: 'Beta', tip: 'The number of questions is limited: 6 per day', hello: 'Hi, I am Sergei’s AI assistant. I can tell you about his cases and experience. Type your own question or pick a suggestion.',
        surprise: 'Surprise me', send: 'Send', stop: 'Stop', left: 'questions left', limit: 'That is enough questions for today. The rest is better discussed with Sergei.', resets: 'You can ask again in {h} h.',
        tg: 'Write on Telegram', placeholder: 'Your question' },
};
const ARROW_UP = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5.5 11.5L12 5l6.5 6.5"/></svg>';
const DICE = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="15" cy="15" r="1" fill="currentColor"/><circle cx="15" cy="9" r="1" fill="currentColor"/><circle cx="9" cy="15" r="1" fill="currentColor"/></svg>';
const ARROW_R = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17L17 7M8.5 7H17v8.5"/></svg>';
const MAXQ = 6;
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const INITIAL = ['edtech', 'hardest', 'research', 'remote'];

// opts.live = true: тот же интерфейс, но ответы идут от настоящей нейросети (POST /api/chat), а не из заготовок.
export function mountAssistantPreview(root, opts = {}) {
  const live = !!opts.live;
  const history = []; // переписка для сервера (только в live-режиме)
  let ctrl = null;
  let sound = null;
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) { sound = new Audio('../sounds/liecio-menu_beep_short_snap-533778.mp3'); sound.volume = 0.12; }
  const plink = () => { if (sound) { sound.currentTime = 0; sound.play().catch(() => {}); } };

  let asked = new Set(), count = 0, busy = false, timers = [], typeTimer = 0;
  const later = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); return id; };

  function build() {
    timers.forEach(clearTimeout); timers = []; clearTimeout(typeTimer);
    asked = new Set(); count = quotaRead().count; busy = false;
    const lang = getLang(), u = DEMO_UI[lang];
    let seed = 11; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const stars = Array.from({ length: 26 }, () => `<i style="left:${(rnd() * 100).toFixed(1)}%;top:${(rnd() * 90).toFixed(1)}%;--s:${(0.9 + rnd() * 1.6).toFixed(1)}px;--d:${(2.4 + rnd() * 4).toFixed(1)}s;--t:${(-rnd() * 6).toFixed(1)}s"></i>`).join('');
    root.innerHTML = `
      <section class="ai" aria-labelledby="ai-title">
        <div class="ai__sky" aria-hidden="true"><div class="stars">${stars}</div><span class="bg-cloud c1"></span><span class="bg-cloud c3"></span></div>
        <div class="ai__card">
          <header class="ai__head">
            <canvas class="ai__pet" aria-hidden="true" title="…"></canvas>
            <div class="ai__titles"><h3 id="ai-title">${u.title}</h3></div>
          </header>
          <div class="ai__body">
            <div class="ai__log" role="log" aria-live="polite"></div>
            <div class="ai__chips"></div>
          </div>
          <form class="ai__form" autocomplete="off">
            <div class="ai__field">
              <input class="ai__input" type="text" maxlength="200" aria-label="${u.placeholder}" placeholder="${u.placeholder}">
              <span class="ai__count" tabindex="0"></span>
            </div>
            <button class="ai__send" type="submit" aria-label="${u.send}">${ARROW_UP}</button>
          </form>
        </div>
      </section>`;
    const $ = (sel) => root.querySelector(sel);
    const ai = $('.ai'), log = $('.ai__log'), chips = $('.ai__chips'), input = $('.ai__input'), send = $('.ai__send'), form = $('.ai__form');
    const pet = createSprite($('.ai__pet'));

    const scroll = () => { log.scrollTop = log.scrollHeight; };
    const miniPet = '<canvas class="ai__mini-pet" aria-hidden="true"></canvas>';
    const addBot = (html) => { const row = document.createElement('div'); row.className = 'ai__row'; row.innerHTML = `${miniPet}<div class="ai__bubble">${html}</div>`; log.appendChild(row); createSprite(row.querySelector('canvas')); scroll(); return row.querySelector('.ai__bubble'); };
    const addUser = (text) => { const m = document.createElement('div'); m.className = 'ai__user'; m.textContent = text; log.appendChild(m); scroll(); };
    const caseCard = (id) => { const c = CASES[id]; return `<a class="ai__case" href="${c.href}"><img src="${c.cover}" alt="" width="64" height="44" loading="lazy"><span class="ai__case-t"><b>${pick(c.title, lang)}</b><small>${pick(c.sub, lang)}</small></span><span class="ai__case-go">${ARROW_R}</span></a>`; };
    const tgCard = () => `<a class="ai__case ai__case--tg" href="${TG}" target="_blank" rel="noopener"><span class="ai__case-t"><b>${u.tg}</b><small>@babyoslik</small></span><span class="ai__case-go">${ARROW_R}</span></a>`;
    // Питомец в чате: думает (смотрит в сторону, рот чёрточкой), говорит (рот открывается), ждёт (улыбка, моргает)
    let talk = 0;
    const setState = (st) => {
      ai.classList.toggle('is-thinking', st === 'thinking'); ai.classList.toggle('is-speaking', st === 'speaking');
      clearInterval(talk);
      if (st === 'thinking') { pet.s.eyes = 'open'; pet.s.mouth = 'flat'; pet.s.lx = 1; pet.s.ly = 0; }
      else if (st === 'speaking') { pet.s.eyes = 'open'; pet.s.lx = 0; let o = false; talk = setInterval(() => { o = !o; pet.s.mouth = o ? 'o' : 'smile'; pet.draw(); }, 170); timers.push(talk); }
      else { pet.s.eyes = 'happy'; pet.s.mouth = 'smile'; pet.s.lx = 0; pet.s.ly = 0; later(() => { pet.s.eyes = 'open'; pet.draw(); }, 900); }
      pet.draw();
    };
    const petC = pet.canvas;
    const hopPet = () => { if (reduce()) return; petC.classList.remove('is-hop'); void petC.offsetWidth; petC.classList.add('is-hop'); };
    petC.addEventListener('click', () => { hopPet(); pet.s.eyes = 'happy'; pet.s.mouth = 'o'; pet.draw(); later(() => { pet.s.eyes = 'open'; pet.s.mouth = 'smile'; pet.draw(); }, 800); });
    // моргание
    const blink = () => { if (!ai.classList.contains('is-thinking') && pet.s.eyes === 'open' && !reduce()) { pet.s.eyes = 'blink'; pet.draw(); later(() => { if (pet.s.eyes === 'blink') { pet.s.eyes = 'open'; pet.draw(); } }, 140); } later(blink, 2500 + Math.random() * 3500); };
    later(blink, 2000);
    // питомец из угла «переехал» сюда: здоровается
    document.removeEventListener('pet:away', mountAssistantPreview.away);
    mountAssistantPreview.away = () => { hopPet(); pet.s.eyes = 'happy'; pet.s.mouth = 'o'; pet.draw(); later(() => { pet.s.eyes = 'open'; pet.s.mouth = 'smile'; pet.draw(); }, 900); };
    document.addEventListener('pet:away', mountAssistantPreview.away);

    function renderChips(ids, onlyDice) {
      chips.innerHTML = '';
      const rest = Object.keys(DEMO).filter((k) => !asked.has(k));
      const list = onlyDice ? [] : ids.filter((k) => !asked.has(k)).slice(0, 4);
      list.forEach((k, i) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'ai__chip'; b.style.setProperty('--i', i); b.textContent = pick(DEMO[k].q, lang); b.addEventListener('click', () => ask(k)); chips.appendChild(b); });
      if (rest.length) { const d = document.createElement('button'); d.type = 'button'; d.className = 'ai__chip ai__chip--dice'; d.style.setProperty('--i', list.length); d.innerHTML = `${DICE}<span>${u.surprise}</span>`; d.addEventListener('click', () => ask(rest[Math.floor(Math.random() * rest.length)])); chips.appendChild(d); }
    }
    function updateCounter() {
      const left = MAXQ - count, badge = $('.ai__count');
      badge.style.display = count > 0 ? '' : 'none'; // счётчик появляется только после первого вопроса
      if (count === 0) return;
      // «Осталось 10» / «Остался 1»; подсказка при наведении объясняет, что количество вопросов ограничено
      badge.textContent = lang === 'en' ? `${left} left` : `${left === 1 ? 'Остался' : 'Осталось'} ${left}`;
      badge.dataset.tip = u.tip;
      badge.setAttribute('aria-label', `${badge.textContent}. ${u.tip}`);
      badge.classList.toggle('is-low', left <= 2);
      badge.classList.remove('is-tick'); void badge.offsetWidth; badge.classList.add('is-tick');
    }

    // Настоящий ответ: тот же интерфейс, поток текста с сервера
    async function askLive(id, free) {
      const question = (free || (id ? pick(DEMO[id].q, lang) : '')).trim();
      if (!question || busy || count >= MAXQ) return;
      busy = true; ai.classList.add('is-asked');
      if (id) asked.add(id);
      addUser(question); input.value = ''; chips.classList.add('is-hidden');
      send.innerHTML = '<span class="ai__stop"></span>'; send.setAttribute('aria-label', u.stop);
      const bubble = addBot(`<span class="ai__think">${T[lang].thinking}</span>`);
      setState('thinking');
      history.push({ role: 'user', content: question });
      ctrl = new AbortController();
      let answer = '', stream = null, failed = '', detail = '';
      const ensure = () => { if (!stream) { setState('speaking'); bubble.textContent = ''; stream = createWordStream(bubble, scroll); } return stream; };
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (ASSISTANT_KEY) headers['x-assistant-key'] = ASSISTANT_KEY;
        const r = await fetch(API, { method: 'POST', headers, signal: ctrl.signal, body: JSON.stringify({ messages: history, page: 'home' }) });
        if (r.status === 429) failed = 'limit';
        else if (!r.ok || !r.body) { let t = ''; try { t = (await r.text()).slice(0, 60); } catch {} throw new Error(`${r.status} ${t}`.trim()); }
        else {
          count = quotaBump().count; updateCounter();
          const reader = r.body.getReader(), dec = new TextDecoder();
          for (;;) {
            const part = await reader.read(); if (part.done) break;
            answer += dec.decode(part.value, { stream: true });
            ensure().update(stripMarkers(answer), false);
          }
        }
      } catch (e) {
        if (e.name === 'AbortError') { if (stream) stream.skip(); }
        else if (!answer) { failed = 'error'; detail = e.message || ''; }
      }
      const finish = () => {
        const caret = bubble.querySelector('.ai__caret'); if (caret) caret.remove();
        setState(''); busy = false; send.innerHTML = ARROW_UP; send.setAttribute('aria-label', u.send);
        if (count >= MAXQ) lockDemo(); else { chips.classList.remove('is-hidden'); renderChips([], true); }
        scroll();
      };
      if (failed) {
        history.pop();
        bubble.innerHTML = `${failed === 'limit' ? u.limit : T[lang].errorTitle}${detail && ASSISTANT_KEY ? `<small class="ai__err"> (${detail.replace(/[<>&]/g, '')})</small>` : ''}${tgCard()}`;
        finish(); return;
      }
      if (!answer) { history.pop(); bubble.parentElement.remove(); finish(); return; }
      await new Promise((res) => { const st = ensure(); st.onDone(res); st.update(stripMarkers(answer), true); });
      let extra = 0;
      markers(answer).forEach((m) => {
        if (extra >= 2) return;
        if (m === 'contact') { bubble.insertAdjacentHTML('beforeend', tgCard()); extra++; }
        else if (m.startsWith('case:') && CASES[m.slice(5)]) { bubble.insertAdjacentHTML('beforeend', caseCard(m.slice(5))); extra++; }
      });
      history.push({ role: 'assistant', content: answer });
      finish();
    }

    function ask(id, free) {
      if (live) return askLive(id, free);
      if (busy || count >= MAXQ) return;
      busy = true; count = quotaBump().count; updateCounter(); ai.classList.add('is-asked');
      const item = id ? DEMO[id] : null;
      if (id) asked.add(id);
      addUser(free || pick(item.q, lang));
      input.value = ''; chips.classList.add('is-hidden'); send.innerHTML = '<span class="ai__stop"></span>'; send.setAttribute('aria-label', u.stop);
      const bubble = addBot(`<span class="ai__think">${T[lang].thinking}</span>`);
      setState('thinking');
      const text = item ? pick(item.a, lang) : DEMO_FALLBACK[lang];
      const done = () => {
        const caret = bubble.querySelector('.ai__caret'); if (caret) caret.remove();
        if (!bubble.querySelector('.ai__w')) bubble.textContent = text;
        const card = item ? item.card : 'contact';
        if (card) bubble.insertAdjacentHTML('beforeend', card === 'contact' ? tgCard() : caseCard(card));
        setState(''); busy = false; scroll();
        send.innerHTML = ARROW_UP; send.setAttribute('aria-label', u.send);
        if (count >= MAXQ) lockDemo();
        else { chips.classList.remove('is-hidden'); renderChips([], true); }
      };
      later(() => {
        setState('speaking'); bubble.textContent = '';
        const st = createWordStream(bubble, scroll);
        st.onDone(() => later(done, 120));
        st.update(text, true);
      }, reduce() ? 0 : 750 + Math.random() * 450);
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = input.value.trim();
      if (!v || busy) return;
      if (live) { askLive(null, v); return; }
      const hit = Object.keys(DEMO).find((k) => DEMO[k].keys.test(v));
      ask(hit && !asked.has(hit) ? hit : (hit ? hit : null), v);
    });
    send.addEventListener('click', () => { if (live && busy && ctrl) ctrl.abort(); }); // кнопка «Стоп»
    // Питомец смотрит за курсором
    ai.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || ai.classList.contains('is-thinking') || ai.classList.contains('is-speaking')) return;
      const r = petC.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const lx = dx < -120 ? -1 : dx > 120 ? 1 : 0, ly = dy > 100 ? 1 : 0;
      if (lx !== pet.s.lx || ly !== pet.s.ly) { pet.s.lx = lx; pet.s.ly = ly; pet.draw(); }
    });
    // Клавиша «/» ставит курсор в поле
    const slash = (e) => { if (e.key === '/' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); input.focus({ preventScroll: false }); } };
    document.removeEventListener('keydown', mountAssistantPreview.slash);
    mountAssistantPreview.slash = slash;
    document.addEventListener('keydown', slash);

    // Подсказка в поле печатается сама и меняется
    const examples = INITIAL.map((k) => pick(DEMO[k].q, lang));
    let ei = 0, ci = 0, erasing = false;
    const typeLoop = () => {
      if (document.activeElement === input || input.value || reduce()) { input.placeholder = u.placeholder; typeTimer = setTimeout(typeLoop, 1500); return; }
      const full = examples[ei];
      if (!erasing) { ci++; input.placeholder = full.slice(0, ci); if (ci >= full.length) { erasing = true; typeTimer = setTimeout(typeLoop, 1800); return; } typeTimer = setTimeout(typeLoop, 55); }
      else { ci -= 2; if (ci <= 0) { ci = 0; erasing = false; ei = (ei + 1) % examples.length; } input.placeholder = full.slice(0, Math.max(ci, 0)) || '…'; typeTimer = setTimeout(typeLoop, 22); }
    };

    // Лимит исчерпан (в том числе до перезагрузки страницы): поле закрыто, сообщение говорит, когда он обновится
    function lockDemo() {
      input.disabled = true; send.disabled = true; chips.innerHTML = ''; ai.classList.add('is-asked');
      addBot(`${u.limit} ${u.resets.replace('{h}', quotaHoursLeft())}${tgCard()}`);
    }
    if (count >= MAXQ) lockDemo();
    else { addBot(u.hello); renderChips(INITIAL); }
    updateCounter(); typeLoop();
  }
  document.addEventListener('langchange', build);
  build();
  return { focus: () => { const i = root.querySelector('.ai__input'); if (i) i.focus({ preventScroll: true }); } };
}
