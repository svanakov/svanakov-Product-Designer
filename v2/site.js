// Общая оболочка v2: шапка, меню, язык, подсветка раздела. Подключается на всех страницах как module.
import { dict } from './data/i18n.js';

export const CV_URL = 'https://docs.google.com/document/d/1lS1M_EPvBqCf02c1Itqb2-nbwyS-jOtRtXmlW8Z_R6E/edit?usp=sharing';
export const TG_URL = 'https://t.me/svanakov';
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

// Каждая ссылка раздела: на главной это якорь, на остальных страницах путь на главную с якорем.
const NAV = [
  { id: 'cases', key: 'nav.cases' },
  { id: 'works', key: 'nav.works' },
  { id: 'workflow', key: 'nav.workflow' },
  { id: 'about', key: 'nav.about' },
  { id: 'experience', key: 'nav.experience' },
];

const isHome = document.body.dataset.page === 'home';
const reloadOnLang = document.body.hasAttribute('data-lang-reload');
const href = (id) => (isHome ? `#${id}` : `./#${id}`);

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
const burgerIcon = '<svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true"><path d="M3 6H19M3 11H19M3 16H19" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const closeIcon = '<svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true"><path d="M4 4L18 18M18 4L4 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

function navLinks(cls) {
  const items = NAV.map((n) => `<a href="${href(n.id)}" data-nav="${n.id}" data-i18n="${n.key}"></a>`).join('');
  return items + `<a href="${CV_URL}" target="_blank" rel="noopener" data-i18n="nav.cv"></a>`;
}

function mountHeader() {
  const slot = document.getElementById('site-header');
  if (!slot) return;
  slot.outerHTML = `
  <header class="site-header" id="header">
    <div class="scroll-progress" id="progress" aria-hidden="true"></div>
    <div class="site-header__row">
      <a class="brand" href="${isHome ? '#top' : './'}"><img src="../uploads/avatar.jpg" alt="" width="32" height="32"><span data-i18n="site.name"></span></a>
      <nav class="nav" data-i18n-aria="nav.main">${navLinks()}</nav>
      <div class="tools">${themeBtn()}${langBtns()}
        <button type="button" class="burger" id="burger" aria-expanded="false" aria-controls="menu" data-i18n-aria="nav.menu">${burgerIcon}</button>
      </div>
    </div>
  </header>
  <div class="menu" id="menu" hidden role="dialog" aria-modal="true" data-i18n-aria="nav.menu">
    <div class="menu__top">
      <div class="tools">${langBtns()}${themeBtn()}</div>
      <button type="button" class="burger" id="menu-close" style="display:inline-flex" data-i18n-aria="nav.close">${closeIcon}</button>
    </div>
    <nav class="menu__links" data-i18n-aria="nav.main">${navLinks()}</nav>
  </div>`;
}

function setupMenu() {
  const menu = document.getElementById('menu');
  const burger = document.getElementById('burger');
  const closeBtn = document.getElementById('menu-close');
  if (!menu || !burger) return;
  const open = () => {
    menu.hidden = false; document.body.classList.add('menu-open'); burger.setAttribute('aria-expanded', 'true'); closeBtn.focus();
  };
  const close = () => {
    menu.hidden = true; document.body.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false'); burger.focus({ preventScroll: true });
  };
  burger.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  menu.addEventListener('click', (e) => { if (e.target.closest('a[href^="#"], a[href^="./"]')) { menu.hidden = true; document.body.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false'); } });
  document.addEventListener('keydown', (e) => {
    if (menu.hidden) return;
    if (e.key === 'Escape') return close();
    if (e.key === 'Tab') { // фокус остаётся внутри меню
      const f = [...menu.querySelectorAll('a, button')].filter((el) => el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  window.matchMedia('(min-width: 881px)').addEventListener('change', (m) => { if (m.matches && !menu.hidden) close(); });
}

function setupCompact() {
  const header = document.getElementById('header');
  if (!header) return;
  const bar = document.getElementById('progress');
  const update = () => {
    header.classList.toggle('is-compact', window.scrollY > 24);
    if (bar) { const max = document.documentElement.scrollHeight - window.innerHeight; bar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`; }
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
}

// Подсветка текущего раздела на главной: активен последний раздел, верх которого выше 40% экрана.
// Финал (#contact) пункта в меню не имеет, поэтому на нём подсветка снимается.
function setupScrollSpy() {
  if (!isHome) return;
  const ids = [...NAV.map((n) => n.id), 'contact'];
  const update = () => {
    let current = '';
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.4) current = id;
    }
    document.querySelectorAll('[data-nav]').forEach((a) => {
      if (a.dataset.nav === current) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  };
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
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

mountHeader();
applyI18n();
setupMenu();
setupCompact();
setupScrollSpy();
setupLang();
