// Главная v2: отрисовка секций из data/*.js и поведение страницы.
import { cases as allCases } from './data/cases.js';
const cases = allCases.filter((c) => !c.worksOnly); // кейсы только для страницы «Все кейсы» на главной не нужны
import { experience } from './data/experience.js';
import { t, pick, getLang, applyI18n, FLAGS, CV_URL, TG_URL, MAIL } from './site.js';
import { video } from './data/video.js';
import { mountAssistant, mountAssistantPreview } from './assistant.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (id) => document.getElementById(id);

function renderCases(lang) {
  $('cases-list').innerHTML = cases.map((c, i) => {
    const inner = `
        <div class="case-card__cover">${c.cover ? `<img src="${esc(c.cover)}" alt="" loading="lazy">` : ''}${c.logo ? `<span class="case-card__logo"><img src="${esc(c.logo)}" alt=""></span>` : ''}${c.soon ? `<span class="case-card__soon">${esc(t('cases.soon', lang))}</span>` : ''}</div>
        <div class="case-card__body">
          <div class="case-card__head">
            <h3 class="case-card__title">${esc(pick(c.title, lang))}</h3>
            ${c.year ? `<span class="case-card__year">${esc(c.year)}</span>` : ''}
          </div>
          <p class="case-card__text">${esc(pick(c.tagline, lang))}</p>
          <ul class="case-card__stack">${(c.stack || []).map((s) => `<li>${esc(pick(s, lang))}</li>`).join('')}</ul>
        </div>`;
    return c.soon
      ? `<article class="case-card is-soon" id="case-${esc(c.slug)}" style="--i:${i}"><div class="case-card__link">${inner}</div></article>`
      : `<article class="case-card" id="case-${esc(c.slug)}" style="--i:${i}"><a class="case-card__link" href="${esc(c.href)}" data-case="${esc(c.slug)}">${inner}</a></article>`;
  }).join('');
}

// Lucide (lucide.dev, ISC): иконки сфер
const JOB_ICONS = {
  cap: '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" /> <path d="M22 10v6" /> <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />',
  cart: '<circle cx="8" cy="21" r="1" /> <circle cx="19" cy="21" r="1" /> <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />',
  tooth: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /> <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />',
  globe: '<circle cx="12" cy="12" r="10" /> <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /> <path d="M2 12h20" />',
};

function renderExperience(lang) {
  const open = new Set([...document.querySelectorAll('.job.is-open')].map((j) => j.dataset.i));
  $('timeline').innerHTML = experience.map((e, i) => {
    const company = pick(e.company, lang);
    const isOpen = open.has(String(i));
    return `
    <li class="job${isOpen ? ' is-open' : ''}" data-i="${i}">
      <button type="button" class="job__toggle" aria-expanded="${isOpen}" aria-controls="job-${i}">
        <span class="job__logo" style="--h:${e.hue || 260}" aria-hidden="true"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${JOB_ICONS[e.icon] || JOB_ICONS.globe}</svg></span>
        <span class="job__main">
          <span class="job__title">${esc(company)}</span>
          <span class="job__role">${esc(pick(e.role, lang))}</span>
        </span>
        <span class="job__period">${esc(pick(e.period, lang))}</span>
        <svg class="job__chev" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      <div class="job__panel" id="job-${i}"><div class="job__panel-in">
        <div class="job__domain">${esc(pick(e.domain, lang))}</div>
        <ul class="job__results">${e.results.map((r) => `<li>${esc(pick(r, lang))}</li>`).join('')}</ul>
      </div></div>
    </li>`;
  }).join('');
}
$('timeline').addEventListener('click', (e) => {
  const b = e.target.closest('.job__toggle'); if (!b) return;
  const job = b.closest('.job'), on = job.classList.toggle('is-open');
  b.setAttribute('aria-expanded', String(on));
});

const COPY_ICON = '<svg class="ic-copy" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15"/></svg><svg class="ic-done" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const CONTACT_ICONS = {
  telegram: '<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>',
  email: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  phone: '<path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/>',
  cv: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
};
const contactIcon = (k) => `<svg class="big-link__ico" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${CONTACT_ICONS[k]}</svg>`;
const DOWNLOAD_ICON = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V3"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/></svg>';
function renderContact(lang) {
  const arrow = '<span class="big-link__arrow" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18L18 6M8.5 6H18v9.5"/></svg></span>';
  const row = (href, label, kind, value, ext, icon, dl) => `
    <div class="big-link">
      <a class="big-link__main" href="${href}"${ext ? ' target="_blank" rel="noopener"' : ''}><span class="big-link__label">${contactIcon(icon)}<span>${esc(label)}</span></span>${arrow}</a>
      ${kind
        ? `<span class="copy-wrap"><button type="button" class="copy-btn" data-copy="${esc(value)}" data-kind="${kind}" aria-label="${esc(t('contact.copy.' + kind, lang))}" title="${esc(t('contact.copy.' + kind, lang))}">${COPY_ICON}</button><span class="copy-tip" aria-hidden="true"></span></span>`
        : dl ? `<span class="copy-wrap"><a class="dl-btn" href="${dl}" download="Sergei_Vanakov_CV.pdf" aria-label="${esc(t('contact.download', lang))}" title="${esc(t('contact.download', lang))}">${DOWNLOAD_ICON}</a></span>`
        : '<span class="copy-wrap copy-wrap--empty" aria-hidden="true"></span>'}
    </div>`;
  $('big-links').innerHTML =
    row(TG_URL, t('contact.telegram', lang), 'telegram', '@babyoslik', true, 'telegram') +
    row(`mailto:${MAIL}`, t('contact.email', lang), 'email', MAIL, false, 'email') +
    row('tel:+79065327822', t('contact.phone', lang), 'phone', '+7 (906) 532 78-22', false, 'phone') +
    row(CV_URL, t('contact.cv', lang), null, '', true, 'cv', './uploads/Sergei_Vanakov_CV.pdf');
}

// Копирование контакта: клик по самой строке открывает контакт, кнопка справа копирует и показывает подсказку.
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* нет доступа к буферу, пробуем старый способ */ }
  const ta = document.createElement('textarea');
  ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
  document.body.appendChild(ta); ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch { ok = false; }
  ta.remove();
  return ok;
}
function setupCopy() {
  const timers = new WeakMap();
  $('big-links').addEventListener('click', async (e) => {
    const btn = e.target.closest('.copy-btn'); if (!btn) return;
    const ok = await copyText(btn.dataset.copy);
    const wrap = btn.closest('.copy-wrap'), tip = wrap.querySelector('.copy-tip');
    tip.textContent = ok ? t('contact.copied.' + btn.dataset.kind) : t('contact.copy.' + btn.dataset.kind);
    wrap.classList.toggle('is-failed', !ok);
    wrap.classList.add('is-shown'); btn.classList.toggle('is-done', ok);
    const live = $('copy-status'); if (live) live.textContent = tip.textContent;
    clearTimeout(timers.get(wrap));
    timers.set(wrap, setTimeout(() => { wrap.classList.remove('is-shown'); btn.classList.remove('is-done'); }, 2000));
  });
}

// Нижняя навигация: плавающие «таблетки», подсвечивается раздел, в котором сейчас страница.
const DOCK = [['cases', 'nav.cases'], ['workflow', 'nav.workflow'], ['experience', 'nav.experience'], ['assistant', 'nav.assistant'], ['contact', 'hero.chipContacts']];
function renderDock(lang) {
  const dock = $('dock');
  dock.setAttribute('aria-label', t('nav.main', lang));
  const up = `<button type="button" class="dock__top" id="dock-top" aria-label="${esc(t('nav.top', lang))}" title="${esc(t('nav.top', lang))}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5.5 11.5L12 5l6.5 6.5"/></svg></button>`;
  const hint = `<button type="button" class="dock__hint" id="dock-hint" aria-label="${esc(t('nav.scroll', lang))}" title="${esc(t('nav.scroll', lang))}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5.5 12.5L12 19l6.5-6.5"/></svg></button>`;
  dock.classList.add('dock--intro');
  dock.innerHTML = hint + up + DOCK.map(([id, key], i) => `<a href="#${id}" data-dock="${id}" style="--i:${i}">${esc(t(key, lang))}</a>`).join('');
  // Точная ширина каждого пункта (текст + отступы 18+18): раскрытие идёт ровно до неё, без «пустого» хвоста анимации
  const measure = () => dock.querySelectorAll('a').forEach((a) => a.style.setProperty('--w', `${a.scrollWidth + 36}px`));
  measure(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  updateDock();
}
function updateDock() {
  // Сверху страницы навигации не видно: только пульсирующая стрелка вниз. Начали листать: стрелка раскрывается в навигацию.
  const dockEl = $('dock');
  if (dockEl) {
    const y = window.scrollY, open = dockEl.classList.contains('is-open');
    const next = open || y > 40; // однажды раскрывшись, навигация обратно в стрелку не сворачивается
    if (next !== open) {
      dockEl.classList.toggle('is-open', next);
      if (next) { // пока навигация раскрывается, размытие фона выключено (оно перерисовывается каждый кадр и тормозит анимацию)
        dockEl.classList.add('is-opening');
        clearTimeout(dockEl._opening);
        dockEl._opening = setTimeout(() => dockEl.classList.remove('is-opening'), 1300);
      }
    }
    dockEl.querySelectorAll('a').forEach((a) => { a.tabIndex = next ? 0 : -1; }); // скрытые пункты не попадают в фокус клавиатуры
    const hintBtn = $('dock-hint'); if (hintBtn) { hintBtn.tabIndex = next ? -1 : 0; hintBtn.setAttribute('aria-hidden', next ? 'true' : 'false'); }
  }
  // Кнопка «наверх» слева от навигации появляется, когда долистали до раздела контактов
  const top = $('dock-top'), contact = $('contact');
  if (top && contact) top.classList.toggle('is-visible', contact.getBoundingClientRect().top <= window.innerHeight * 0.6); // стрелка «наверх» появляется, как только долистали до контактов
  // Текущий раздел: тот, чей верх ниже всех, но уже выше 40% экрана.
  let current = '', best = -Infinity;
  for (const [id] of DOCK) {
    const el = document.getElementById(id);
    if (!el) continue;
    const top = el.getBoundingClientRect().top;
    if (top <= window.innerHeight * 0.4 && top > best) { best = top; current = id; }
  }
  // Начали листать, но до кейсов ещё не доехали: «Кейсы» уже горят. Вернулись в самый верх: подсветки нет.
  if (!current && window.scrollY > 40) current = DOCK[0][0];
  document.querySelectorAll('#dock a').forEach((a) => {
    if (a.dataset.dock === current) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
  });
}

// Клик по точке плавно прокручивает к кейсу: карточка встаёт на своё место в стопке
function scrollToCase(i) {
  const card = document.querySelectorAll('.case-card')[i]; if (!card) return;
  let top;
  if (getComputedStyle(card).position === 'sticky') {
    const wrap = document.querySelector('.cases-wrap');
    top = wrap.getBoundingClientRect().top + window.scrollY + i * (card.offsetHeight + STACK_GAP) - STACK_TOP + 2;
  } else top = card.getBoundingClientRect().top + window.scrollY - STACK_TOP;
  window.scrollTo({ top, behavior: reduceMotion() ? 'auto' : 'smooth' });
}
$('cases-dots').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) scrollToCase(Number(b.dataset.i)); });

// ---- Все карточки кейсов одной высоты: берём высоту самой высокой ----
function equalizeCards() {
  const wrap = document.querySelector('.cases-wrap'), cards = [...document.querySelectorAll('.case-card')];
  if (!wrap || !cards.length) return;
  wrap.style.removeProperty('--card-h');
  cards.forEach((c) => { c.style.height = 'auto'; });
  const h = Math.ceil(Math.max(...cards.map((c) => c.offsetHeight)));
  wrap.style.setProperty('--card-h', `${h}px`);
  cards.forEach((c) => { c.style.height = ''; });
}

// ---- Стопка карточек: прогресс --p и счётчик ----
const STACK_TOP = 112, STACK_STEP = 0, STACK_GAP = 48; // совпадают с site.css
const stackMQ = matchMedia('(prefers-reduced-motion: no-preference) and (min-height: 701px)');
function updateStack() {
  const cards = [...document.querySelectorAll('.case-card')];
  if (!cards.length) return;
  if (!stackMQ.matches) { cards.forEach((c) => c.style.removeProperty('--p')); return; }
  let active = 0;
  cards.forEach((card, i) => {
    const next = cards[i + 1];
    let p = 0;
    if (next) {
      const travel = next.getBoundingClientRect().top - (STACK_TOP + (i + 1) * STACK_STEP);
      p = 1 - Math.min(1, Math.max(0, travel / (card.offsetHeight + STACK_GAP)));
    }
    card.style.setProperty('--p', p.toFixed(3));
    if (card.getBoundingClientRect().top <= STACK_TOP + i * STACK_STEP + 60) active = i;
  });
  const dots = $('cases-dots');
  if (dots) {
    const lang = getLang();
    if (dots.children.length !== cards.length || dots.dataset.lang !== lang) {
      dots.innerHTML = cards.map((c, i) => `<button type="button" data-i="${i}" aria-label="${esc(pick(cases[i].title, lang))}"></button>`).join('');
      dots.dataset.lang = lang;
    }
    [...dots.children].forEach((d, i) => d.classList.toggle('is-active', i === active));
  }
}
function setupStack() {
  window.addEventListener('resize', updateStack);
  stackMQ.addEventListener('change', updateStack);
  updateStack();
}

// ---- Возврат со страницы кейса: восстановить прокрутку к тому же месту ----
// Браузерное восстановление отключаем: карточки рисуются скриптом, и оно срабатывает до нужной высоты страницы.
const SCROLL_KEY = 'v2:home-scroll';
function setupScrollRestore() {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const read = () => { try { return JSON.parse(sessionStorage.getItem(SCROLL_KEY) || 'null'); } catch { return null; } };
  const write = (o) => { try { sessionStorage.setItem(SCROLL_KEY, JSON.stringify(o)); } catch {} };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-case]');
    if (a) write({ y: window.scrollY, slug: a.dataset.case });
  });
  window.addEventListener('pagehide', () => write({ ...(read() || {}), y: window.scrollY }));
  const type = (performance.getEntriesByType('navigation')[0] || {}).type;
  if (type !== 'back_forward' && type !== 'reload') return;
  const s = read();
  if (!s || typeof s.y !== 'number' || location.hash) return;
  const go = () => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, s.y); document.documentElement.style.scrollBehavior = ''; updateStack(); };
  go();
  window.addEventListener('load', go, { once: true }); // высота могла измениться после загрузки картинок
}

// ---- Видео: чип в Hero, превью в «Как я работаю», модалка ----
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function setupVideo() {
  const modal = $('video-modal'), body = $('video-body'), media = $('workflow-media');
  const open = () => {
    const lang = getLang();
    if (video.src) {
      if (!body.querySelector('video')) {
        const v = document.createElement('video');
        v.controls = true; v.playsInline = true; v.preload = 'metadata';
        if (video.poster) v.poster = video.poster;
        v.innerHTML = `<source src="${esc(video.src)}" type="video/mp4">`;
        ['ru', 'en'].forEach((l) => {
          if (!video.subtitles[l]) return;
          const tr = document.createElement('track');
          tr.kind = 'subtitles'; tr.src = video.subtitles[l]; tr.srclang = l; tr.label = l === 'ru' ? 'Русский' : 'English'; tr.default = l === lang;
          v.appendChild(tr);
        });
        body.textContent = ''; body.appendChild(v);
      }
    } else {
      body.innerHTML = video.poster ? `<div class="modal__soon" data-label="${esc(t('workflow.video', lang))}"><img class="modal__poster" src="${esc(video.poster)}" alt=""></div>` : `<div class="modal__ph"><span class="todo">${esc(t('workflow.video', lang))}</span></div>`;
    }
    modal.showModal();
    const v = body.querySelector('video'); if (v) v.play().catch(() => {});
  };
  // Закрытие: Esc и крестик (нативно/кнопкой), клик по фону; видео ставим на паузу.
  modal.addEventListener('click', (e) => { if (e.target === modal || e.target.closest('#video-close')) modal.close(); });
  modal.addEventListener('close', () => { const v = body.querySelector('video'); if (v) v.pause(); });
  media.addEventListener('click', open);

  // Пока видео нет, блок показывает обложку (постер).
  if (video.poster && !video.previewSrc) {
    media.classList.add('has-video');
    const img = document.createElement('img');
    img.src = video.poster; img.alt = ''; img.decoding = 'async';
    media.prepend(img);
  }

  // Беззвучный фрагмент на повторе, загружается только когда блок близко к экрану.
  if (video.previewSrc) {
    media.classList.add('has-video');
    const v = document.createElement('video');
    v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'none'; v.setAttribute('aria-hidden', 'true');
    if (video.poster) v.poster = video.poster;
    v.src = video.previewSrc;
    media.prepend(v);
    if ('IntersectionObserver' in window && !reduceMotion()) {
      new IntersectionObserver((en) => en.forEach((x) => { if (x.isIntersecting) v.play().catch(() => {}); else v.pause(); }), { threshold: 0.3 }).observe(media);
    }
  }
}

// ---- Ассистент: встроенный блок и чип в Hero ----
// Настоящий ассистент включён флагом ASSISTANT_LIVE. Без ключа всем показывается только макет.
// (и он по-прежнему виден только владельцу с ключом, пока PUBLIC = false в site.js).
// Пока настоящий ответ только на localhost (там прокси на боевой бэкенд). На сайте у всех демо с подсказками.
// Включить на сайте: поставить true.
const ASSISTANT_LIVE = true; // настоящий ассистент для всех посетителей
let assistant = null;
function setupAssistant() {
  assistant = mountAssistantPreview($('assistant-slot'), { live: ASSISTANT_LIVE && FLAGS.ASSISTANT_ENABLED }); // тот же интерфейс; живой режим только с ключом
}

// ---- Появление секций при скролле ----
function setupReveal() {
  document.querySelectorAll('[data-reveal-group]').forEach((g) => [...g.children].forEach((c, i) => { c.setAttribute('data-reveal', ''); c.style.setProperty('--d', i); }));
  const items = [...document.querySelectorAll('[data-reveal]')];
  if (!('IntersectionObserver' in window) || reduceMotion()) { items.forEach((x) => x.classList.add('is-in')); window.__revealReady = true; return; }
  const io = new IntersectionObserver((en) => en.forEach((x) => { if (x.isIntersecting) { x.target.classList.add('is-in'); io.unobserve(x.target); } }), { rootMargin: '0px 0px -8% 0px' });
  items.forEach((x) => io.observe(x));
  window.__revealReady = true;
}

function renderAll() {
  const lang = getLang();
  renderCases(lang); equalizeCards(); renderExperience(lang); renderContact(lang); renderDock(lang);
  applyI18n(document, lang);
  $('assistant-slot').hidden = false;
  updateStack();
}

renderAll();
$('dock').addEventListener('click', (e) => { if (e.target.closest('#dock-hint')) { const n = document.getElementById('cases'); if (n) n.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth' }); return; } if (e.target.closest('#dock-top')) window.scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' }); });
setupCopy();
setupStack();
// Прокрутка обрабатывается не чаще одного раза за кадр: раньше стопка и навигация считали раскладку на каждое событие и мешали анимации.
let scrollTick = 0;
window.addEventListener('scroll', () => {
  if (scrollTick) return;
  scrollTick = requestAnimationFrame(() => { scrollTick = 0; updateDock(); updateStack(); });
}, { passive: true });
window.addEventListener('resize', updateDock);
window.addEventListener('resize', () => { equalizeCards(); updateStack(); });
window.addEventListener('load', () => { equalizeCards(); updateStack(); });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { equalizeCards(); updateStack(); });
setupScrollRestore();
setupVideo();
setupAssistant();
setupReveal();

// ---- Вместо кнопки «Подробнее» курсор над карточкой кейса превращается в надпись ----
function setupCardCursor() {
  const list = $('cases-list');
  if (!list || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const tag = document.createElement('div');
  tag.className = 'card-cursor'; tag.setAttribute('aria-hidden', 'true');
  document.body.appendChild(tag);
  const label = () => { tag.textContent = t('cases.more', getLang()); };
  label(); document.addEventListener('langchange', label);
  let tx = 0, ty = 0, x = 0, y = 0, on = false, raf = 0;
  const tick = () => {
    const k = reduceMotion() ? 1 : 0.28;
    x += (tx - x) * k; y += (ty - y) * k;
    tag.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
    raf = on || Math.hypot(tx - x, ty - y) > 0.5 ? requestAnimationFrame(tick) : 0;
  };
  const show = (e) => {
    tx = e.clientX; ty = e.clientY;
    if (!on) { on = true; x = tx; y = ty; tag.classList.add('is-on'); }
    if (!raf) raf = requestAnimationFrame(tick);
  };
  const hide = () => { on = false; tag.classList.remove('is-on'); };
  list.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' && e.target.closest('a.case-card__link')) show(e); else if (on) hide(); });
  list.addEventListener('pointerleave', hide);
  addEventListener('blur', hide);
}
setupCardCursor();
document.addEventListener('langchange', renderAll);
