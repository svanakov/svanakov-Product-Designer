// Навигация страницы кейса.
// 1) Справа «линейка» разделов: тонкие штрихи, активный тёмный и длиннее; при наведении раскрывается панель со списком разделов.
// 2) Снизу панель: предыдущий кейс, «ко всем кейсам / на главную» (по тому, откуда пришёл человек), следующий кейс.
import { cases } from './data/cases.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const svg = (d, w = 20) => `<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ARROW_L = svg('<path d="M19 12H5M11 6l-6 6 6 6"/>'), ARROW_R = svg('<path d="M5 12h14M13 6l6 6-6 6"/>');
const GRID = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="2.2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2.2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2.2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2.2"/></svg>'; // четыре равных контурных квадрата

export function mountCaseNav({ homeHref, homeLabel, lang }) {
  const T = lang === 'en'
    ? { sections: 'Case sections', cases: 'Case navigation', prev: 'Previous case', next: 'Next case' }
    : { sections: 'Разделы кейса', cases: 'Навигация по кейсам', prev: 'Предыдущий кейс', next: 'Следующий кейс' };
  const title = (c) => (c.title[lang] || c.title.ru);

  // ---- кнопка «вернуться» слева сверху: на главную или ко всем кейсам, смотря откуда пришли ----
  const back = document.createElement('a');
  back.className = 'back-btn';
  back.href = homeHref;
  back.innerHTML = `${svg('<path d="M19 12H5M11 6l-6 6 6 6"/>', 16)}<span>${esc(homeLabel)}</span>`;
  document.body.insertBefore(back, document.body.firstChild);

  // ---- нижняя панель ----
  const list = cases.filter((c) => !c.soon && c.href);
  const cur = list.findIndex((c) => location.pathname.endsWith(c.href.replace('./', '/')));
  const prev = cur > 0 ? list[cur - 1] : null; // на первом кейсе стрелки «назад» нет, на последнем нет «вперёд»
  const next = cur >= 0 && cur < list.length - 1 ? list[cur + 1] : null;
  const arrow = (c, cls, icon, label) => c
    ? `<a class="cn-bar__a" href="${esc(c.href)}" aria-label="${esc(label + ': ' + title(c))}" data-tip="${esc(label + ': ' + title(c))}">${icon}</a>`
    : `<span class="cn-bar__a is-off" aria-hidden="true">${icon}</span>`;
  const bar = document.createElement('nav');
  bar.className = 'cn-bar';
  bar.setAttribute('aria-label', T.cases);
  bar.innerHTML = `${arrow(prev, 'prev', ARROW_L, T.prev)}<a class="cn-bar__home" href="${esc(homeHref)}" aria-label="${esc(homeLabel)}" data-tip="${esc(homeLabel)}">${GRID}</a>${arrow(next, 'next', ARROW_R, T.next)}`;
  document.body.appendChild(bar);

  // ---- линейка разделов с иерархией ----
  // Верхний уровень: самостоятельные разделы и этапы процесса (Discover, Define, ...) или группы, заданные в data-group.
  // Вложенные: разделы этапа. Строка этапа ведёт к его первому разделу.
  const nav = document.createElement('aside');
  nav.className = 'cn';
  nav.setAttribute('aria-label', T.sections);
  document.body.appendChild(nav);
  let rows = [], secRows = [], sig = '', active = -1;

  const read = () => {
    const out = []; let lastKey = null, group = null;
    document.querySelectorAll('article section[id], main section[id]').forEach((el) => {
      const label = ((el.querySelector('h2') || {}).textContent || '').trim();
      if (!label || label.includes('{{')) return;
      const stage = el.closest('.stage');
      let key = null, gl = '', gn = '';
      if (stage) { key = 'stage:' + (stage.id || ''); gl = ((stage.querySelector('.stage-name') || {}).textContent || '').trim(); gn = ((stage.querySelector('.stage-num') || {}).textContent || '').trim(); }
      else if (el.dataset.group) { key = 'group:' + el.dataset.group; gl = el.dataset.group; }
      if (key && key !== lastKey) { group = { kind: 'g', label: gl, num: gn, el, kids: 0 }; out.push(group); }
      if (!key) group = null;
      lastKey = key;
      const row = { kind: 's', label, el, id: el.id, child: !!key, group };
      if (group) group.kids++;
      out.push(row);
    });
    return out;
  };

  const rail = () => rows.map((r, i) => `<i class="cn-dash ${r.kind === 'g' ? 'is-group' : ''}${i === active ? ' is-on' : ''}"></i>`).join('');
  const panel = () => rows.map((r, i) => r.kind === 'g'
    ? `<a class="cn-item is-group${rows[active] && rows[active].group === r ? ' is-in' : ''}" href="#" data-i="${i}"><span>${r.num ? `<b>${esc(r.num)}</b>` : ''}${esc(r.label)}</span><i class="cn-dash is-group"></i></a>`
    : `<a class="cn-item${r.child ? ' is-child' : ''}${i === active ? ' is-on' : ''}" href="#${esc(r.id)}" data-i="${i}"><span>${esc(r.label)}</span><i class="cn-dash"></i></a>`).join('');
  const render = () => {
    const gap = Math.max(8, Math.min(26, Math.floor((window.innerHeight * 0.66 - rows.length * 4) / Math.max(1, rows.length - 1))));
    nav.innerHTML = `<div class="cn-rail" aria-hidden="true" style="gap:${gap}px">${rail()}</div><nav class="cn-panel">${panel()}</nav>`;
  };
  const setActive = (i) => { if (i === active) return; active = i; render(); };
  // Телефон: в бургере только тема, язык и контакты (навигация по разделам там не нужна)
  const pushMobile = () => import('./mobile-menu.js').then((m) => m.setMobileMenu({ links: [], homeLink: true, compact: true, cv: null, contacts: true, getActive: () => -1 }));
  const sync = () => {
    const found = read(), s = found.map((x) => x.kind + '|' + x.label).join('~');
    if (s === sig) return;
    sig = s; rows = found; active = -1;
    nav.hidden = rows.filter((r) => r.kind === 's').length < 3;
    if (!nav.hidden) update();
    pushMobile();
  };
  const update = () => {
    let idx = 0;
    rows.forEach((r, i) => { if (r.kind === 's' && r.el.getBoundingClientRect().top <= window.innerHeight * 0.35) idx = i; });
    if (!rows.some((r) => r.kind === 's')) return;
    if (rows[idx].kind !== 's') idx = rows.findIndex((r) => r.kind === 's');
    if (idx === active) return;
    active = -1; setActive(idx);
  };
  nav.addEventListener('click', (e) => {
    const a = e.target.closest('.cn-item'); if (!a) return;
    e.preventDefault();
    const r = rows[Number(a.dataset.i)]; if (!r) return;
    r.el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  });
  let tick = 0;
  window.addEventListener('scroll', () => { if (!tick) tick = requestAnimationFrame(() => { tick = 0; update(); }); }, { passive: true });
  window.addEventListener('resize', update);
  // Телефон: нижняя панель не мешает чтению: прячется, пока листаешь вниз, и возвращается при прокрутке вверх
  let lastY = scrollY;
  window.addEventListener('scroll', () => {
    if (innerWidth > 720) { bar.classList.remove('is-hidden'); return; }
    const y = scrollY;
    if (Math.abs(y - lastY) > 8) { bar.classList.toggle('is-hidden', y > lastY && y > 120); lastY = y; }
  }, { passive: true });
  // страницу кейса рисует рантайм и может перерисовать: следим за разметкой и пересобираем линейку, если разделы изменились
  let t = 0;
  new MutationObserver(() => { clearTimeout(t); t = setTimeout(sync, 150); }).observe(document.body, { childList: true, subtree: true });
  window.addEventListener('load', sync);
  sync();
}
