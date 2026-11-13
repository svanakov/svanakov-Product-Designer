// Виджет ИИ-ассистента. Подключается на всех страницах: <script src="./assistant.js" defer></script>
// Закрытый режим: пока PUBLIC = false, виджет виден только тому, кто открыл сайт с ?assistant=<ключ>.
// Выключить у себя: ?assistant=off. Открыть всем: PUBLIC = true и удалить ASSISTANT_KEY в Vercel.
(function () {
  'use strict';

  var PUBLIC = false;
  var API = '/api/chat';
  var TG = 'https://t.me/svanakov';
  var MAX_QUESTIONS = 10;

  // ---------- доступ ----------
  var key = null;
  try {
    var params = new URLSearchParams(location.search);
    var p = params.get('assistant');
    if (p === 'off') localStorage.removeItem('asst_key');
    else if (p) localStorage.setItem('asst_key', p);
    if (p) {
      params.delete('assistant');
      var qs = params.toString();
      history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
    }
    key = localStorage.getItem('asst_key');
  } catch (e) { /* storage недоступен */ }
  if (!PUBLIC && !key) return;

  // ---------- контекст ----------
  var isEn = false;
  try { isEn = localStorage.getItem('lang') === 'en'; } catch (e) {}
  var page = (function () {
    var f = location.pathname.split('/').pop().replace('.html', '');
    return { rytmo: 'rytmo', campus: 'campus', dispatch: 'dispatch' }[f] || 'home';
  })();

  var T = isEn ? {
    launcher: 'Ask the AI assistant', title: 'Ask about Sergei', preview: 'Private preview, visible only to you',
    placeholder: 'Your question', send: 'Send', stop: 'Stop', close: 'Close',
    hint: 'AI can make mistakes. For exact answers, ask Sergei on Telegram.',
    thinking: 'Thinking…',
    errorTitle: 'The assistant is unavailable right now.',
    limitTitle: 'That is enough questions for one chat.',
    tgText: 'Ask Sergei on Telegram', tgBtn: 'Open Telegram',
    cases: { rytmo: 'Open the Rytmo case', campus: 'Open the Campus case', dispatch: 'Open the Dispatcher Console case' },
    contact: 'Ask Sergei on Telegram'
  } : {
    launcher: 'Спросить ИИ-ассистента', title: 'Спросите о Сергее', preview: 'Предпросмотр, виден только вам',
    placeholder: 'Ваш вопрос', send: 'Отправить', stop: 'Стоп', close: 'Закрыть',
    hint: 'ИИ может ошибаться. Точные ответы у Сергея в Telegram.',
    thinking: 'Думаю…',
    errorTitle: 'Ассистент сейчас недоступен.',
    limitTitle: 'На этом вопросов в одном чате достаточно.',
    tgText: 'Спросить Сергея в Telegram', tgBtn: 'Открыть Telegram',
    cases: { rytmo: 'Открыть кейс Rytmo', campus: 'Открыть кейс Campus', dispatch: 'Открыть кейс «Диспетчерская консоль»' },
    contact: 'Спросить Сергея в Telegram'
  };

  var CHIPS = {
    home: isEn
      ? ['What is Sergei’s experience in EdTech?', 'Tell me about the hardest project', 'How does Sergei do research?', 'Does he work remotely?']
      : ['Какой опыт в EdTech?', 'Расскажи про самый сложный проект', 'Как Сергей проводит исследования?', 'Работает ли удалённо?'],
    rytmo: isEn
      ? ['What was the test result?', 'What was the hardest part?', 'How were the hypotheses prioritized?']
      : ['Какой результат теста?', 'Что было самым сложным?', 'Как приоритизировали гипотезы?'],
    campus: isEn
      ? ['Why a PWA?', 'What were the limitations?', 'Who uses it?']
      : ['Почему PWA?', 'Какие были ограничения?', 'Кто пользуется?'],
    dispatch: isEn
      ? ['What problem does it solve?', 'Was it tested with users?', 'How is exception priority calculated?']
      : ['Какую проблему решает?', 'Проверяли ли на пользователях?', 'Как считается приоритет исключения?']
  }[page];

  var CASE_URLS = { rytmo: 'rytmo.html', campus: 'campus.html', dispatch: 'dispatch.html' };

  // ---------- стили ----------
  var css = [
    '.asst-root{position:fixed;right:24px;bottom:24px;z-index:900;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Helvetica,Arial,sans-serif;font-size:15px;line-height:1.45;color:oklch(0.19 0.006 80)}',
    '.asst-root *{box-sizing:border-box}',
    '.asst-launcher{display:inline-flex;align-items:center;gap:8px;padding:12px 18px;border-radius:999px;border:none;background:rgb(12,12,12);color:#fff;font:inherit;font-weight:500;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.12);transition:transform 160ms ease}',
    '.asst-launcher:hover{transform:translateY(-1px)}',
    '.asst-launcher:focus-visible,.asst-btn:focus-visible,.asst-chip:focus-visible,.asst-input:focus-visible,.asst-link:focus-visible{outline:2px solid rgb(12,12,12);outline-offset:2px}',
    '.asst-panel{display:none;flex-direction:column;width:380px;height:min(560px,calc(100vh - 48px));background:#fff;border:1px solid rgb(230,230,228);border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.14);overflow:hidden}',
    '.asst-root.asst-open .asst-panel{display:flex}',
    '.asst-root.asst-open .asst-launcher{display:none}',
    '.asst-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:16px 16px 12px;border-bottom:1px solid rgb(230,230,228)}',
    '.asst-title{font-weight:600;font-size:16px}',
    '.asst-sub{font-size:12px;color:oklch(0.55 0.006 80);margin-top:2px}',
    '.asst-x{background:none;border:none;padding:4px;cursor:pointer;color:rgb(66,67,61);border-radius:8px;line-height:0}',
    '.asst-log{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:14px}',
    '.asst-msg{max-width:88%;white-space:pre-wrap;word-wrap:break-word}',
    '.asst-msg.asst-user{align-self:flex-end;background:rgb(247,247,246);border:1px solid rgb(230,230,228);padding:8px 12px;border-radius:12px}',
    '.asst-msg.asst-bot{align-self:flex-start}',
    '.asst-msg.asst-pending{color:oklch(0.55 0.006 80)}',
    '.asst-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}',
    '.asst-link{display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border-radius:8px;border:1px solid rgb(230,230,228);background:rgb(247,247,246);color:rgb(12,12,12);font-size:13px;font-weight:500;text-decoration:none}',
    '.asst-link:hover{background:rgb(240,240,238)}',
    '.asst-chips{display:flex;flex-direction:column;gap:8px;align-items:flex-start}',
    '.asst-chip{padding:8px 12px;border-radius:10px;border:1px solid rgb(230,230,228);background:#fff;font:inherit;font-size:14px;color:rgb(12,12,12);cursor:pointer;text-align:left}',
    '.asst-chip:hover{background:rgb(247,247,246)}',
    '.asst-card{border:1px solid rgb(230,230,228);background:rgb(247,247,246);border-radius:12px;padding:12px 14px}',
    '.asst-form{display:flex;gap:8px;padding:12px 16px 8px}',
    '.asst-input{flex:1;min-width:0;padding:10px 12px;border-radius:10px;border:1px solid rgb(230,230,228);font:inherit;color:inherit;background:#fff}',
    '.asst-btn{padding:0 14px;border-radius:10px;border:none;background:rgb(12,12,12);color:#fff;font:inherit;font-weight:500;cursor:pointer}',
    '.asst-btn[disabled]{opacity:.4;cursor:default}',
    '.asst-hint{padding:0 16px 12px;font-size:12px;color:oklch(0.55 0.006 80)}',
    '@media (max-width:720px){.asst-root{right:0;bottom:0;left:0}.asst-launcher{position:fixed;right:16px;bottom:16px}',
    '.asst-panel{width:100%;height:100dvh;border-radius:0;border:none}}'
  ].join('');
  var style = document.createElement('style');
  style.textContent = css;

  // ---------- состояние ----------
  var history_ = [];
  try { history_ = JSON.parse(sessionStorage.getItem('asst_chat') || '[]'); } catch (e) {}
  var busy = false;
  var ctrl = null;

  function save() { try { sessionStorage.setItem('asst_chat', JSON.stringify(history_)); } catch (e) {} }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function stripMarkers(t) {
    return t.replace(/\[\[[^\]]*\]\]/g, '').replace(/\[\[[^\]]*$/, '').replace(/\[$/, '').trim();
  }
  function markers(t) {
    var out = [];
    t.replace(/\[\[([^\]]+)\]\]/g, function (m, k) { if (out.indexOf(k) === -1) out.push(k); return m; });
    return out;
  }

  // ---------- DOM ----------
  var root = el('div', 'asst-root');
  var launcher = el('button', 'asst-launcher');
  launcher.type = 'button';
  launcher.setAttribute('aria-expanded', 'false');
  launcher.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H10l-6 4z"/></svg>';
  launcher.appendChild(el('span', null, T.launcher));

  var panel = el('div', 'asst-panel');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', T.title);

  var head = el('div', 'asst-head');
  var headText = el('div');
  headText.appendChild(el('div', 'asst-title', T.title));
  if (!PUBLIC) headText.appendChild(el('div', 'asst-sub', T.preview));
  var closeBtn = el('button', 'asst-x');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', T.close);
  closeBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  head.appendChild(headText);
  head.appendChild(closeBtn);

  var log = el('div', 'asst-log');
  log.setAttribute('role', 'log');
  log.setAttribute('aria-live', 'polite');

  var form = el('form', 'asst-form');
  var input = el('input', 'asst-input');
  input.type = 'text';
  input.maxLength = 500;
  input.placeholder = T.placeholder;
  input.setAttribute('aria-label', T.placeholder);
  input.autocomplete = 'off';
  var sendBtn = el('button', 'asst-btn', T.send);
  sendBtn.type = 'submit';
  form.appendChild(input);
  form.appendChild(sendBtn);
  var hint = el('div', 'asst-hint', T.hint);

  panel.appendChild(head);
  panel.appendChild(log);
  panel.appendChild(form);
  panel.appendChild(hint);
  root.appendChild(launcher);
  root.appendChild(panel);

  // ---------- рендер ----------
  function scrollDown() { log.scrollTop = log.scrollHeight; }

  function actionLinks(text) {
    var ms = markers(text);
    if (!ms.length) return null;
    var box = el('div', 'asst-actions');
    ms.forEach(function (m) {
      var a = el('a', 'asst-link');
      a.rel = 'noopener';
      if (m === 'contact') { a.href = TG; a.target = '_blank'; a.textContent = T.contact; box.appendChild(a); }
      else if (m.indexOf('case:') === 0 && CASE_URLS[m.slice(5)]) {
        a.href = './' + CASE_URLS[m.slice(5)]; a.textContent = T.cases[m.slice(5)]; box.appendChild(a);
      }
    });
    return box.children.length ? box : null;
  }

  function addMsg(role, text) {
    var m = el('div', 'asst-msg ' + (role === 'user' ? 'asst-user' : 'asst-bot'));
    m.textContent = role === 'user' ? text : stripMarkers(text);
    log.appendChild(m);
    if (role !== 'user') {
      var acts = actionLinks(text);
      if (acts) m.appendChild(acts);
    }
    return m;
  }

  function tgCard(title) {
    var c = el('div', 'asst-card');
    c.appendChild(el('div', null, title));
    var a = el('a', 'asst-link', T.tgBtn);
    a.href = TG; a.target = '_blank'; a.rel = 'noopener';
    var w = el('div', 'asst-actions');
    w.appendChild(a);
    c.appendChild(w);
    return c;
  }

  function questionsAsked() { return history_.filter(function (m) { return m.role === 'user'; }).length; }

  function setBusy(v) {
    busy = v;
    sendBtn.textContent = v ? T.stop : T.send;
    sendBtn.type = v ? 'button' : 'submit';
    input.disabled = v;
  }

  function lockIfLimit() {
    if (questionsAsked() >= MAX_QUESTIONS) {
      input.disabled = true; sendBtn.disabled = true;
      if (!log.querySelector('.asst-limit')) {
        var c = tgCard(T.limitTitle);
        c.classList.add('asst-limit');
        log.appendChild(c); scrollDown();
      }
      return true;
    }
    return false;
  }

  function renderAll() {
    log.textContent = '';
    if (!history_.length) {
      var chips = el('div', 'asst-chips');
      CHIPS.forEach(function (q) {
        var b = el('button', 'asst-chip', q);
        b.type = 'button';
        b.addEventListener('click', function () { ask(q); });
        chips.appendChild(b);
      });
      log.appendChild(chips);
    } else {
      history_.forEach(function (m) { addMsg(m.role, m.content); });
    }
    lockIfLimit();
    scrollDown();
  }

  // ---------- запрос ----------
  async function ask(question) {
    question = (question || '').trim();
    if (!question || busy || lockIfLimit()) return;
    var chips = log.querySelector('.asst-chips');
    if (chips) chips.remove();

    history_.push({ role: 'user', content: question });
    save();
    addMsg('user', question);
    input.value = '';

    var bot = el('div', 'asst-msg asst-bot asst-pending', T.thinking);
    log.appendChild(bot);
    scrollDown();
    setBusy(true);
    ctrl = new AbortController();

    var answer = '';
    try {
      var headers = { 'Content-Type': 'application/json' };
      if (key) headers['x-assistant-key'] = key;
      var r = await fetch(API, {
        method: 'POST', headers: headers, signal: ctrl.signal,
        body: JSON.stringify({ messages: history_, page: page })
      });
      if (!r.ok || !r.body) throw new Error('http ' + r.status);
      var reader = r.body.getReader();
      var dec = new TextDecoder();
      for (;;) {
        var s = await reader.read();
        if (s.done) break;
        answer += dec.decode(s.value, { stream: true });
        bot.classList.remove('asst-pending');
        bot.textContent = stripMarkers(answer);
        scrollDown();
      }
    } catch (e) {
      if (e.name !== 'AbortError' && !answer) {
        bot.remove();
        history_.pop(); save();
        log.appendChild(tgCard(T.errorTitle));
        scrollDown();
        setBusy(false);
        return;
      }
    }

    if (answer) {
      bot.classList.remove('asst-pending');
      bot.textContent = stripMarkers(answer);
      var acts = actionLinks(answer);
      if (acts) bot.appendChild(acts);
      history_.push({ role: 'assistant', content: answer });
    } else {
      bot.remove();
      history_.pop();
    }
    save();
    setBusy(false);
    if (!lockIfLimit()) input.focus();
    scrollDown();
  }

  // ---------- события ----------
  function open() {
    root.classList.add('asst-open');
    launcher.setAttribute('aria-expanded', 'true');
    renderAll();
    setTimeout(function () { if (!input.disabled) input.focus(); }, 0);
  }
  function close() {
    if (ctrl) ctrl.abort();
    root.classList.remove('asst-open');
    launcher.setAttribute('aria-expanded', 'false');
    launcher.focus();
  }

  launcher.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && root.classList.contains('asst-open')) close();
  });
  form.addEventListener('submit', function (e) { e.preventDefault(); ask(input.value); });
  sendBtn.addEventListener('click', function () { if (busy && ctrl) ctrl.abort(); });

  function mount() {
    document.head.appendChild(style);
    document.body.appendChild(root);
  }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
