// Главная v2: отрисовка секций из data/*.js и поведение страницы.
import { cases } from './data/cases.js';
import { experience, stack } from './data/experience.js';
import { t, pick, getLang, applyI18n, FLAGS, CV_URL, TG_URL, MAIL } from './site.js';
import { video } from './data/video.js';
import { mountAssistant, mountAssistantPreview } from './assistant.js';
import { mountMarquee } from './marquee.js';
import { works } from './data/works.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (id) => document.getElementById(id);

function renderCases(lang) {
  $('cases-list').innerHTML = cases.map((c, i) => `
    <article class="case-card" id="case-${esc(c.slug)}" style="--i:${i}">
      <a class="case-card__link" href="${esc(c.href)}" data-case="${esc(c.slug)}">
        <div class="case-card__cover"><img src="${esc(c.cover)}" alt="" loading="lazy"></div>
        <div class="case-card__body">
          <h3 class="case-card__title">${esc(pick(c.title, lang))}</h3>
          <div class="case-card__meta">
            <span class="case-card__platform">${esc(c.platform ? pick(c.platform, lang) : '')}</span>
            <ul class="case-card__stack">${(c.stack || []).map((s) => `<li>${esc(pick(s, lang))}</li>`).join('')}</ul>
          </div>
          <div><p class="case-card__label">${esc(t('cases.problem', lang))}</p><p class="case-card__text">${esc(pick(c.problem, lang))}</p></div>
          <div><p class="case-card__label">${esc(t('cases.result', lang))}</p>${[].concat(c.result).length > 1
            ? `<ul class="case-card__list">${[].concat(c.result).map((r) => `<li>${esc(pick(r, lang))}</li>`).join('')}</ul>`
            : `<p class="case-card__text">${esc(pick([].concat(c.result)[0], lang))}</p>`}</div>
          <span class="case-card__btn">${esc(t('cases.more', lang))} <span aria-hidden="true">→</span></span>
        </div>
      </a>
    </article>`).join('');
}

function renderExperience(lang) {
  $('timeline').innerHTML = experience.map((e) => `
    <li class="job">
      <div class="job__head"><span class="job__company">${esc(pick(e.company, lang))}</span><span class="job__period">${esc(pick(e.period, lang))}</span></div>
      <div class="job__role">${esc(pick(e.role, lang))}</div>
      <div class="job__domain">${esc(pick(e.domain, lang))}</div>
      <ul class="job__results">${e.results.map((r) => `<li>${esc(pick(r, lang))}</li>`).join('')}</ul>
    </li>`).join('');
  $('stack').innerHTML = stack.map((g) => `
    <div class="stack__group"><h4>${esc(pick(g.title, lang))}</h4>
      ${g.plain
        ? `<ul class="stack__plain">${g.items.map((i) => `<li>${esc(pick(i, lang))}</li>`).join('')}</ul>`
        : `<ul class="stack__items">${g.items.map((i) => `<li>${esc(pick(i, lang))}</li>`).join('')}</ul>`}
    </div>`).join('');
}

const COPY_ICON = '<svg class="ic-copy" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15"/></svg><svg class="ic-done" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
function renderContact(lang) {
  const arrow = '<span class="big-link__arrow" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18L18 6M8.5 6H18v9.5"/></svg></span>';
  const row = (href, label, kind, value, ext) => `
    <div class="big-link">
      <a class="big-link__main" href="${href}"${ext ? ' target="_blank" rel="noopener"' : ''}><span class="big-link__label">${esc(label)}</span>${arrow}</a>
      ${kind
        ? `<span class="copy-wrap"><button type="button" class="copy-btn" data-copy="${esc(value)}" data-kind="${kind}" aria-label="${esc(t('contact.copy.' + kind, lang))}" title="${esc(t('contact.copy.' + kind, lang))}">${COPY_ICON}</button><span class="copy-tip" aria-hidden="true"></span></span>`
        : '<span class="copy-wrap copy-wrap--empty" aria-hidden="true"></span>'}
    </div>`;
  $('big-links').innerHTML =
    row(TG_URL, t('contact.telegram', lang), 'telegram', '@svanakov', true) +
    row(`mailto:${MAIL}`, t('contact.email', lang), 'email', MAIL, false) +
    row(CV_URL, t('contact.cv', lang), null, '', true);
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
const DOCK = [['cases', 'nav.cases'], ['works', 'nav.works'], ['workflow', 'nav.workflow'], ['experience', 'nav.experience'], ['assistant', 'nav.assistant'], ['contact', 'hero.chipContacts']];
function renderDock(lang) {
  const dock = $('dock');
  dock.setAttribute('aria-label', t('nav.main', lang));
  const up = `<button type="button" class="dock__top" id="dock-top" aria-label="${esc(t('nav.top', lang))}" title="${esc(t('nav.top', lang))}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5.5 11.5L12 5l6.5 6.5"/></svg></button>`;
  const spark = '<svg class="dock__spark" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9L12 2zM19 15l.9 2.6L22.5 18.5l-2.6.9L19 22l-.9-2.6-2.6-.9 2.6-.9L19 15z"/></svg>';
  dock.innerHTML = up + DOCK.map(([id, key]) => id === 'assistant'
    ? `<a href="#${id}" data-dock="${id}" class="dock__ai">${spark}<span>${esc(t(key, lang))}</span></a>`
    : `<a href="#${id}" data-dock="${id}">${esc(t(key, lang))}</a>`).join('');
  updateDock();
}
function updateDock() {
  // Кнопка «наверх» слева от навигации появляется, только когда долистали до конца раздела контактов
  const top = $('dock-top'), contact = $('contact');
  if (top && contact) top.classList.toggle('is-visible', contact.getBoundingClientRect().bottom <= window.innerHeight + 60);
  // Текущий раздел: тот, чей верх ниже всех, но уже выше 40% экрана.
  let current = '', best = -Infinity;
  for (const [id] of DOCK) {
    const el = document.getElementById(id);
    if (!el) continue;
    const top = el.getBoundingClientRect().top;
    if (top <= window.innerHeight * 0.4 && top > best) { best = top; current = id; }
  }
  document.querySelectorAll('#dock a').forEach((a) => {
    if (a.dataset.dock === current) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
  });
}

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
const STACK_TOP = 112, STACK_STEP = 0, STACK_GAP = 32; // совпадают с site.css
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
    if (dots.children.length !== cards.length) dots.innerHTML = cards.map(() => '<span></span>').join('');
    [...dots.children].forEach((d, i) => d.classList.toggle('is-active', i === active));
  }
}
function setupStack() {
  window.addEventListener('scroll', updateStack, { passive: true });
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
      body.innerHTML = `<div class="modal__ph"><span class="todo">${esc(t('workflow.video', lang))}</span></div>`;
    }
    modal.showModal();
    const v = body.querySelector('video'); if (v) v.play().catch(() => {});
  };
  // Закрытие: Esc и крестик (нативно/кнопкой), клик по фону; видео ставим на паузу.
  modal.addEventListener('click', (e) => { if (e.target === modal || e.target.closest('#video-close')) modal.close(); });
  modal.addEventListener('close', () => { const v = body.querySelector('video'); if (v) v.pause(); });
  media.addEventListener('click', open);

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
// Пока ассистент не подключён: всем показывается только макет. Включить настоящий: ASSISTANT_LIVE = true
// (и он по-прежнему виден только владельцу с ключом, пока PUBLIC = false в site.js).
const ASSISTANT_LIVE = false;
let assistant = null;
function setupAssistant() {
  assistant = ASSISTANT_LIVE && FLAGS.ASSISTANT_ENABLED ? mountAssistant($('assistant-slot')) : mountAssistantPreview($('assistant-slot'));
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

// ---- Лёгкий параллакс обложек при наведении (только мышь) ----
function setupParallax() {
  const list = $('cases-list');
  if (!list || !matchMedia('(hover: hover) and (pointer: fine)').matches || reduceMotion()) return;
  list.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const cover = e.target.closest('.case-card__cover'); if (!cover) return;
    const r = cover.getBoundingClientRect();
    cover.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
    cover.style.setProperty('--my', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
  });
  list.addEventListener('pointerout', (e) => {
    const cover = e.target.closest && e.target.closest('.case-card__cover');
    if (cover && !(e.relatedTarget && cover.contains(e.relatedTarget))) { cover.style.removeProperty('--mx'); cover.style.removeProperty('--my'); }
  });
}

function renderAll() {
  const lang = getLang();
  renderCases(lang); equalizeCards(); renderExperience(lang); renderContact(lang); renderDock(lang);
  applyI18n(document, lang);
  $('assistant-slot').hidden = false;
  updateStack();
}

renderAll();
$('dock').addEventListener('click', (e) => { if (e.target.closest('#dock-top')) window.scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' }); });
mountMarquee($('works-marquee'), works, 1); // одна лента, порядок задаёт data/works.js
setupCopy();
setupStack();
window.addEventListener('scroll', updateDock, { passive: true });
window.addEventListener('resize', updateDock);
window.addEventListener('resize', () => { equalizeCards(); updateStack(); });
window.addEventListener('load', () => { equalizeCards(); updateStack(); });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { equalizeCards(); updateStack(); });
setupScrollRestore();
setupVideo();
setupAssistant();
setupReveal();
setupParallax();
document.addEventListener('langchange', renderAll);
