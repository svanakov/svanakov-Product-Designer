// Общая оболочка v2: плавающие переключатели темы и языка, тексты. Подключается на всех страницах как module.
import { dict } from './data/i18n.js';

export const CV_URL = 'https://docs.google.com/document/d/1lS1M_EPvBqCf02c1Itqb2-nbwyS-jOtRtXmlW8Z_R6E/edit?usp=sharing';
export const TG_URL = 'https://t.me/babyoslik';
export const MAIL = 'vanakovsergey2004@yandex.ru';

// Закрытый режим ассистента (как в v1): пока PUBLIC = false, блок виден только тому, кто открыл сайт с ?assistant=<ключ>.
// Выключить у себя: ?assistant=off. Открыть всем: PUBLIC = true и удалить ASSISTANT_KEY в Vercel.
export const PUBLIC = false;
export let ASSISTANT_KEY = null;
try {
  const params = new URLSearchParams(location.search);
  const p = params.get('assistant');
  if (p === 'off') localStorage.removeItem('asst_key');
  else if (p) localStorage.setItem('asst_key', p);
  if (p) {
    params.delete('assistant');
    const qs = params.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
  }
  ASSISTANT_KEY = localStorage.getItem('asst_key');
} catch { /* storage недоступен */ }

// Флаги фаз. ASSISTANT_ENABLED = ассистент доступен посетителю (публичный режим или есть ключ).
export const FLAGS = { VIDEO: true, ASSISTANT_ENABLED: PUBLIC || !!ASSISTANT_KEY };

const reloadOnLang = document.body.hasAttribute('data-lang-reload');

export function getLang() {
  try { return localStorage.getItem('lang') === 'en' ? 'en' : 'ru'; } catch { return 'ru'; }
}
export const t = (key, lang = getLang()) => (dict[lang] && dict[lang][key]) ?? dict.ru[key] ?? key;
export const pick = (obj, lang = getLang()) => (typeof obj === 'string' ? obj : obj[lang] ?? obj.ru);

// Подставляет тексты в элементы с data-i18n / data-i18n-aria / data-i18n-alt. Строки TODO подсвечиваются.
export function applyI18n(root = document, lang = getLang()) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    const v = t(el.dataset.i18n, lang);
    el.textContent = v;
    el.classList.toggle('todo', v.startsWith('TODO'));
  });
  root.querySelectorAll('[data-i18n-aria]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.i18nAria, lang)));
  root.querySelectorAll('[data-i18n-alt]').forEach((el) => el.setAttribute('alt', t(el.dataset.i18nAlt, lang)));
  root.querySelectorAll('[data-i18n-title]').forEach((el) => el.setAttribute('title', t(el.dataset.i18nTitle, lang)));
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
}

export function setTodo(el, text) {
  el.textContent = text;
  el.classList.toggle('todo', String(text).startsWith('TODO'));
}

const THEME_ICON = '<svg class="ti-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg><svg class="ti-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
const themeBtn = () => `<button type="button" class="theme-toggle" data-theme-toggle data-i18n-aria="nav.theme" data-i18n-title="nav.theme">${THEME_ICON}</button>`;
const langBtns = () => '<div class="lang"><button type="button" data-lang="ru">RU</button><span aria-hidden="true">/</span><button type="button" data-lang="en">EN</button></div>';
// Плавающая панель в углу: переключатель темы и языка. Шапки нет.
// На страницах кейсов добавляется маленькая стрелка назад (иначе с кейса некуда вернуться, пока нет нового шаблона).
const backIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
function mountControls() {
  const slot = document.getElementById('site-header');
  if (!slot) return;
  slot.outerHTML = `<div class="float-controls" id="float-controls">${themeBtn()}<span class="float-sep" aria-hidden="true"></span>${langBtns()}</div>`;
  if (document.body.dataset.page === 'case') mountBackButtons();
}

// Страницы кейсов: кнопка «вернуться» слева сверху, которая исчезает у конца страницы, и статичная ссылка «вернуться»
// внизу, в одной строке со ссылкой «Смотреть …» (оформлена так же, как она).
// Куда вести «назад»: откуда пользователь пришёл на кейс. С главной возвращаем на главную, со страницы кейсов на страницу кейсов.
// Переходы между самими кейсами («Смотреть …») источник не меняют, поэтому он запоминается на время вкладки.
function backHref() {
  let origin = null;
  try { origin = sessionStorage.getItem('case_origin'); } catch { /* ок */ }
  try {
    const ref = document.referrer ? new URL(document.referrer) : null;
    if (ref && ref.origin === location.origin) {
      if (/\/cases\.html$/.test(ref.pathname)) origin = 'cases';
      else if (/\/(index\.html)?$/.test(ref.pathname)) origin = 'home';
    }
  } catch { /* ок */ }
  try { if (origin) sessionStorage.setItem('case_origin', origin); } catch { /* ок */ }
  return origin === 'home' ? { href: './#cases', key: 'case.backHome' } : { href: './cases.html', key: 'case.back' };
}

function mountBackButtons() {
  const { href, key } = backHref();
  const label = `<span aria-hidden="true">←</span><span data-i18n="${key}"></span>`;
  document.body.insertAdjacentHTML('afterbegin', `<a class="back-btn" id="back-btn" href="${href}">${label}</a>`);
  document.body.insertAdjacentHTML('beforeend', `<a class="back-link" id="back-link" href="${href}">${label}</a>`);
  const btn = document.getElementById('back-btn'), bottom = document.getElementById('back-link');

  // Страница кейса рисуется старым рантаймом и может перерисовываться, поэтому в её разметку ничего не вставляем:
  // нижняя ссылка лежит в body и ставится по координатам строки со ссылкой «Смотреть …».
  const findLink = () => document.querySelector('article a[href="campus.html"], article a[href="dispatch.html"], article a[href="rytmo.html"], article a[href="vpnmini.html"]');

  function update() {
    const link = findLink();
    if (!link) return;
    const r = link.getBoundingClientRect();
    bottom.style.display = '';
    bottom.style.left = `${link.parentElement.getBoundingClientRect().left + window.scrollX}px`;
    bottom.style.top = `${r.top + window.scrollY + (r.height - bottom.offsetHeight) / 2}px`;
    // Верхняя кнопка тает за 300 px до конца страницы и исчезает совсем, когда внизу видна нижняя ссылка.
    const vh = window.innerHeight;
    const restTop = r.top + window.scrollY - (document.documentElement.scrollHeight - vh);
    const fade = Math.min(1, Math.max(0, (r.top - restTop) / 300));
    btn.style.opacity = fade.toFixed(3);
    btn.style.pointerEvents = fade < 0.5 ? 'none' : '';
    btn.tabIndex = fade < 0.5 ? -1 : 0;
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  window.addEventListener('load', update);
  new MutationObserver(update).observe(document.body, { childList: true, subtree: true });
  bottom.style.display = 'none';
  update();
}

function setupLang() {
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-lang]');
    if (!b) return;
    try { localStorage.setItem('lang', b.dataset.lang); } catch {}
    if (reloadOnLang) return location.reload(); // страницы кейсов на старом рантайме читают язык при загрузке
    applyI18n(document, b.dataset.lang);
    document.dispatchEvent(new CustomEvent('langchange', { detail: b.dataset.lang }));
  });
}

mountControls();
applyI18n();
setupLang();

// Звук клика по ссылкам, как в первой версии: тихий щелчок на устройствах с мышью.
// Переход на другую страницу откладывается на 150 мс, чтобы звук успел прозвучать.
// На страницах кейсов этот звук уже есть в их собственном скрипте, поэтому там не дублируем.
function setupClickSound() {
  if (document.body.dataset.page === 'case') return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const sound = new Audio('../sounds/liecio-menu_beep_short_snap-533778.mp3');
  sound.volume = 0.15;
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;
    sound.currentTime = 0;
    sound.play().catch(() => {});
    const href = link.getAttribute('href');
    const stays = !href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('http') || link.target === '_blank' || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey;
    if (!stays) {
      e.preventDefault();
      setTimeout(() => { window.location.href = link.href; }, 150);
    }
  });
}
setupClickSound();

// Далёкие облака на заднем плане верха страницы (кроме страниц кейсов и страницы работ: там только цвета темы).
if (document.body.dataset.page !== 'case' && document.body.dataset.page !== 'all-cases') {
  // Звёзды: мерцающие точки, видны только в тёмной теме. Генератор с фиксированным зерном, чтобы небо не менялось при каждой загрузке.
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const stars = Array.from({ length: 70 }, () => {
    const size = (0.9 + rnd() * 1.8).toFixed(1);
    return `<i style="left:${(rnd() * 100).toFixed(1)}%;top:${(rnd() * 88).toFixed(1)}%;--s:${size}px;--d:${(2.4 + rnd() * 4).toFixed(1)}s;--t:${(-rnd() * 6).toFixed(1)}s"></i>`;
  }).join('');
  document.body.insertAdjacentHTML('afterbegin', `<div class="sky" aria-hidden="true"><div class="stars">${stars}</div><span class="bg-cloud c1"></span><span class="bg-cloud c2"></span><span class="bg-cloud c3"></span><span class="bg-cloud c4"></span><span class="bg-cloud c5"></span></div>`);
}
