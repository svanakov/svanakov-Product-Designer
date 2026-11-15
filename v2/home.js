// Главная v2: отрисовка секций из data/*.js и поведение страницы.
import { cases } from './data/cases.js';
import { experience, stack } from './data/experience.js';
import { t, pick, getLang, applyI18n, FLAGS, CV_URL, TG_URL, MAIL } from './site.js';
import { video } from './data/video.js';
import { mountAssistant, mountAssistantPreview } from './assistant.js';
import { mountMarquee } from './marquee.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (id) => document.getElementById(id);

function renderCases(lang) {
  $('cases-list').innerHTML = cases.map((c, i) => `
    <article class="case-card" id="case-${esc(c.slug)}" style="--i:${i}">
      <a class="case-card__link" href="${esc(c.href)}" data-case="${esc(c.slug)}">
        <div class="case-card__cover"><img src="${esc(c.cover)}" alt="" loading="lazy"></div>
        <div class="case-card__body">
          <div class="case-card__meta"><span>${esc(pick(c.domain, lang))}</span><span>${esc(t('cases.kind.' + c.kind, lang))}</span></div>
          <h3 class="case-card__title">${esc(pick(c.title, lang))}</h3>
          <div><p class="case-card__label">${esc(t('cases.problem', lang))}</p><p class="case-card__text">${esc(pick(c.problem, lang))}</p></div>
          <div><p class="case-card__label">${esc(t('cases.result', lang))}</p><p class="case-card__text">${esc(pick(c.result, lang))}<span class="case-card__note">${esc(pick(c.resultNote, lang))}</span></p></div>
          <span class="case-card__btn">${esc(t('cases.more', lang))} <span aria-hidden="true">→</span></span>
        </div>
      </a>
    </article>`).join('');
}

function renderExperience(lang) {
  $('timeline').innerHTML = experience.map((e) => `
    <li>
      <div class="timeline__period ${pick(e.period, lang).startsWith('TODO') ? 'todo' : ''}">${esc(pick(e.period, lang))}</div>
      <div class="timeline__role ${pick(e.role, lang).startsWith('TODO') ? 'todo' : ''}">${esc(pick(e.role, lang))}</div>
      <div class="timeline__domain ${pick(e.domain, lang).startsWith('TODO') ? 'todo' : ''}">${esc(pick(e.domain, lang))}</div>
      <ul>${e.results.map((r) => `<li class="${pick(r, lang).startsWith('TODO') ? 'todo' : ''}">${esc(pick(r, lang))}</li>`).join('')}</ul>
    </li>`).join('');
  $('stack').innerHTML = stack.map((g) => `
    <div class="stack__group"><h4>${esc(t('stack.' + g.key, lang))}</h4>
      <ul class="stack__items">${g.items.map((i) => { const s = pick(i, lang); return `<li class="${s.startsWith('TODO') ? 'todo' : ''}">${esc(s)}</li>`; }).join('')}</ul>
    </div>`).join('');
}

const COPY_ICON = '<svg class="ic-copy" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15"/></svg><svg class="ic-done" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
function renderContact(lang) {
  const arrow = '<span class="big-link__arrow" aria-hidden="true">↗</span>';
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

function renderFooter(lang) {
  const nav = ['cases', 'works', 'workflow', 'about', 'experience'].map((id) => `<a href="#${id}">${esc(t('nav.' + id, lang))}</a>`).join('');
  $('site-footer').innerHTML = `
    <div class="container site-footer__row">
      <nav aria-label="${esc(t('nav.main', lang))}">${nav}<a href="${CV_URL}" target="_blank" rel="noopener">CV</a></nav>
      <div class="lang"><button type="button" data-lang="ru">RU</button><span aria-hidden="true">/</span><button type="button" data-lang="en">EN</button></div>
      <span class="site-footer__copy">© ${new Date().getFullYear()}</span>
    </div>`;
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
  $('chip-video').addEventListener('click', (e) => { e.preventDefault(); open(); });

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
  if (video.minutes) $('chip-video-min').textContent = ` · ${video.minutes} ${t('workflow.min')}`;
}

// ---- Ассистент: встроенный блок и чип в Hero ----
// Пока ассистент не подключён: всем показывается только макет. Включить настоящий: ASSISTANT_LIVE = true
// (и он по-прежнему виден только владельцу с ключом, пока PUBLIC = false в site.js).
const ASSISTANT_LIVE = false;
let assistant = null;
function setupAssistant() {
  assistant = ASSISTANT_LIVE && FLAGS.ASSISTANT_ENABLED ? mountAssistant($('assistant')) : mountAssistantPreview($('assistant'));
  $('chip-assistant').addEventListener('click', (e) => {
    e.preventDefault();
    $('assistant').scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'center' });
    setTimeout(() => assistant.focus(), reduceMotion() ? 0 : 700);
  });
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
  renderCases(lang); renderExperience(lang); renderContact(lang); renderFooter(lang);
  applyI18n(document, lang);
  $('chip-video').hidden = !FLAGS.VIDEO;
  $('chip-assistant').hidden = false;
  $('assistant').hidden = false;
  if ($('chip-video-min') && video.minutes) $('chip-video-min').textContent = ` · ${video.minutes} ${t('workflow.min', lang)}`;
  updateStack();
}

renderAll();
mountMarquee($('works-marquee'));
setupCopy();
setupStack();
setupScrollRestore();
setupVideo();
setupAssistant();
setupReveal();
setupParallax();
document.addEventListener('langchange', renderAll);
