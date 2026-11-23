// Мобильное меню-бургер: кнопка справа сверху и полноэкранная карточка со ссылками, «Смотреть CV», языком и темой.
// Показывается только на телефоне (до 720px), на компьютере скрыто стилями. Содержимое задаёт страница через setMobileMenu().
import { getLang, t, themeBtn, langBtns, TG_URL, MAIL, CV_URL } from './site.js';
import { copyText, COPY_ICON, DOWNLOAD_ICON } from './contacts.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let cfg = { links: [], cv: null, getActive: null };
let btn = null, menu = null, cfgLinks = [];

function open(on) {
  menu.classList.toggle('is-open', on);
  document.documentElement.classList.toggle('m-open', on);
  btn.setAttribute('aria-expanded', String(on));
  menu.setAttribute('aria-hidden', String(!on));
  if (on) { markActive(); }
}
function markActive() {
  const a = cfg.getActive ? cfg.getActive() : -1;
  menu.querySelectorAll('.m-a').forEach((el, i) => el.classList.toggle('is-on', Number(el.dataset.i) === a));
}
function ensure() {
  if (btn) return;
  btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'm-burger'; btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-label', t('nav.menu'));
  btn.innerHTML = '<span></span><span></span><span></span>';
  menu = document.createElement('div');
  menu.className = 'm-menu'; menu.setAttribute('role', 'dialog'); menu.setAttribute('aria-modal', 'true'); menu.setAttribute('aria-hidden', 'true');
  document.body.append(menu, btn);
  btn.addEventListener('click', () => open(!menu.classList.contains('is-open')));
  menu.addEventListener('click', (e) => {
    const a = e.target.closest('.m-a');
    if (a) {
      const i = Number(a.dataset.i), link = cfgLinks[i];
      if (link && link.go) { e.preventDefault(); open(false); setTimeout(link.go, 60); return; }
      if (link && link.href && link.href.startsWith('#')) {
        e.preventDefault(); open(false);
        const el = document.getElementById(link.href.slice(1));
        setTimeout(() => el && el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }), 60);
        return;
      }
      open(false); return; // внешняя ссылка: меню закрываем, переход делает браузер
    }
    const acc = e.target.closest('.m-acc__btn');
    if (acc) { const box = acc.closest('.m-acc'), on = !box.classList.contains('is-open'); box.classList.toggle('is-open', on); acc.setAttribute('aria-expanded', String(on)); return; }
    const cp = e.target.closest('.m-copy');
    if (cp) {
      copyText(cp.dataset.copy).then((ok) => { cp.classList.toggle('is-done', ok); setTimeout(() => cp.classList.remove('is-done'), 1800); });
      return;
    }
    if (e.target.closest('a.m-ib')) { open(false); return; } // ссылка из контактов: меню закрываем, переход делает браузер
    if (e.target === menu) open(false); // клик по затемнению
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('is-open')) open(false); });
  window.addEventListener('resize', () => { if (innerWidth > 720 && menu.classList.contains('is-open')) open(false); });
}
function render() {
  const lang = getLang();
  btn.setAttribute('aria-label', t('nav.menu'));
  const all = cfg.homeLink ? [{ kind: 's', label: t('works.home'), href: './' }].concat(cfg.links) : cfg.links;
  cfgLinks = all;
  const links = all.map((l, i) => {
    const cls = l.kind === 'g' ? 'm-a m-a--g' : `m-a m-a--s${l.child ? ' is-child' : ''}`;
    return `<a class="${cls}" href="${esc(l.href || '#')}" data-i="${i}"><span>${l.num ? `<b>${esc(l.num)}</b>` : ''}${esc(l.label)}</span></a>`;
  }).join('');
  const cv = cfg.cv ? `<a class="btn btn--cv m-cv" href="${esc(cfg.cv.href)}" target="_blank" rel="noopener"><span>${esc(cfg.cv.label)}</span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17L17 7M8.5 7H17v8.5"/></svg></a>` : '';
  // Контакты: раскрывающийся по нажатию список (на страницах кейсов и списка кейсов, где нет своего раздела «Контакты»)
  const OPEN = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17L17 7M8.5 7H17v8.5"/></svg>';
  // Строка контакта: название и значение слева, справа две кнопки: открыть (ссылка) и скопировать (у CV вторая кнопка скачивает файл)
  const row = (label, value, href, ext, second) => `<div class="m-row"><div class="m-row__t"><span>${esc(label)}</span><em>${esc(value)}</em></div><div class="m-row__b"><a class="m-ib" href="${esc(href)}"${ext ? ' target="_blank" rel="noopener"' : ''} aria-label="${esc(label)}">${OPEN}</a>${second}</div></div>`;
  const copyBtn = (v, label) => `<button type="button" class="m-ib m-copy" data-copy="${esc(v)}" aria-label="${esc(label)}">${COPY_ICON}</button>`;
  const dlBtn = `<a class="m-ib" href="./uploads/Sergei_Vanakov_CV.pdf" download="Sergei_Vanakov_CV.pdf" aria-label="${esc(t('contact.download'))}">${DOWNLOAD_ICON}</a>`;
  const contacts = cfg.contacts ? `<div class="m-acc"><button type="button" class="m-acc__btn" aria-expanded="false"><span>${esc(t('hero.chipContacts'))}</span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button><div class="m-acc__panel"><div class="m-acc__in">${row(t('contact.telegram'), '@babyoslik', TG_URL, true, copyBtn('@babyoslik', t('contact.copy.telegram')))}${row(t('contact.email'), MAIL, 'mailto:' + MAIL, false, copyBtn(MAIL, t('contact.copy.email')))}${row(t('contact.phone'), '+7 (906) 532 78-22', 'tel:+79065327822', false, copyBtn('+7 (906) 532 78-22', t('contact.copy.phone')))}${row(t('contact.cv'), 'Google Docs', CV_URL, true, dlBtn)}</div></div></div>` : '';
  menu.innerHTML = `<div class="m-card${cfg.compact ? ' m-card--compact' : ''}"><nav class="m-links">${links}${contacts}</nav><div class="m-foot">${cv}<div class="m-foot__row">${langBtns()}${themeBtn()}</div></div></div>`;
  menu.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  const th = menu.querySelector('[data-theme-toggle]'); if (th) th.setAttribute('aria-label', t('nav.theme'));
}
export function setMobileMenu(next) {
  cfg = { ...cfg, ...next };
  ensure(); render();
}
