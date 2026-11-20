// Галерея экранов на странице кейса: лента на светлой «сцене», вкладки сценариев и крупный просмотр.
// Место на странице задаёт <div data-gallery="rytmo"></div>. Страницы кейсов перерисовывает старый рантайм,
// поэтому галерея следит за разметкой и вставляется заново, если её стёрли.
import { getLang } from './site.js';
import { gallery } from './data/gallery.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const lang = getLang() === 'en' ? 'en' : 'ru';
const L = lang === 'en'
  ? { prev: 'Previous', next: 'Next', close: 'Close', hint: 'Scroll', open: 'Open screen' }
  : { prev: 'Назад', next: 'Вперёд', close: 'Закрыть', hint: 'Листай', open: 'Открыть экран' };
const ARROW = (d) => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
const A_L = 'M15 6l-6 6 6 6', A_R = 'M9 6l6 6-6 6';

// ---- крупный просмотр (один на страницу) ----
let dlg, vImg, vCap, vCnt, vList = [], vIdx = 0;
function ensureViewer() {
  if (dlg) return;
  dlg = document.createElement('dialog');
  dlg.className = 'gal-view';
  dlg.innerHTML = `<div class="gal-view__img"><img alt=""></div>
    <button type="button" class="gal-view__nav is-prev" aria-label="${L.prev}">${ARROW(A_L)}</button>
    <button type="button" class="gal-view__nav is-next" aria-label="${L.next}">${ARROW(A_R)}</button>
    <button type="button" class="gal-view__x" aria-label="${L.close}">${ARROW('M6 6l12 12M18 6L6 18')}</button>
    <div class="gal-view__bar"><span class="gal-view__cap"></span><span class="gal-view__cnt"></span></div>`;
  document.body.appendChild(dlg);
  vImg = dlg.querySelector('img'); vCap = dlg.querySelector('.gal-view__cap'); vCnt = dlg.querySelector('.gal-view__cnt');
  dlg.addEventListener('click', (e) => {
    if (e.target.closest('.is-next')) show(vIdx + 1);
    else if (e.target.closest('.is-prev')) show(vIdx - 1);
    else if (e.target.closest('.gal-view__x') || !e.target.closest('img, .gal-view__bar')) dlg.close();
  });
  dlg.addEventListener('close', () => document.documentElement.classList.remove('gal-open'));
  dlg.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') show(vIdx + 1); else if (e.key === 'ArrowLeft') show(vIdx - 1); });
  let sx = 0;
  dlg.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
  dlg.addEventListener('touchend', (e) => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) show(vIdx + (dx < 0 ? 1 : -1)); }, { passive: true });
}
function show(i) {
  vIdx = (i + vList.length) % vList.length;
  const it = vList[vIdx];
  vImg.src = it.src; vImg.width = it.w; vImg.height = it.h; vImg.alt = it.cap[lang];
  vCap.textContent = it.cap[lang]; vCnt.textContent = `${vIdx + 1} / ${vList.length}`;
  const next = vList[(vIdx + 1) % vList.length], prev = vList[(vIdx - 1 + vList.length) % vList.length];
  [next, prev].forEach((n) => { const im = new Image(); im.src = n.src; }); // соседние экраны подгружаются заранее
}
function openViewer(list, i) { ensureViewer(); vList = list; show(i); document.documentElement.classList.add('gal-open'); dlg.showModal(); }

// ---- сама галерея ----
// Лента экранов листается колёсиком, свайпом, перетаскиванием и стрелками. Подпись под экраном появляется при наведении.
function build(host, data) {
  const groups = data.groups;
  host.classList.add('gal');
  host.innerHTML = `
    ${groups.length > 1 ? `<div class="gal__tabs" role="tablist">${groups.map((g, i) => `<button type="button" role="tab" class="gal__tab${i ? '' : ' is-on'}" data-g="${i}" aria-selected="${i === 0}">${esc(g.title[lang])}</button>`).join('')}</div>` : ''}
    <div class="gal__stage">
      <div class="gal__strip"></div>
      <button type="button" class="gal__nav is-prev" aria-label="${L.prev}">${ARROW(A_L)}</button>
      <button type="button" class="gal__nav is-next" aria-label="${L.next}">${ARROW(A_R)}</button>
    </div>`;
  const strip = host.querySelector('.gal__strip');
  let cur = 0;
  const fill = (gi) => {
    cur = gi;
    const items = groups[gi].items;
    strip.innerHTML = items.map((it, i) => `<figure class="gal__item"><button type="button" data-i="${i}" aria-label="${esc(L.open + ': ' + it.cap[lang])}"><img src="${it.src}" width="${it.w}" height="${it.h}" alt="${esc(it.cap[lang])}"${i > 2 ? ' loading="lazy"' : ''} draggable="false"></button><figcaption>${esc(it.cap[lang])}</figcaption></figure>`).join('');
    strip.scrollTo({ left: 0 });
    edges();
  };
  const step = () => { const f = strip.querySelector('.gal__item'); return f ? f.getBoundingClientRect().width + 28 : 280; };
  const edges = () => {
    host.querySelector('.is-prev').classList.toggle('is-off', strip.scrollLeft < 8);
    host.querySelector('.is-next').classList.toggle('is-off', strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 8);
  };
  strip.addEventListener('scroll', edges, { passive: true });
  host.querySelector('.is-prev').addEventListener('click', () => strip.scrollBy({ left: -step(), behavior: 'smooth' }));
  host.querySelector('.is-next').addEventListener('click', () => strip.scrollBy({ left: step(), behavior: 'smooth' }));
  host.querySelectorAll('.gal__tab').forEach((b) => b.addEventListener('click', () => {
    host.querySelectorAll('.gal__tab').forEach((x) => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-selected', String(on)); });
    fill(Number(b.dataset.g));
  }));
  strip.addEventListener('click', (e) => { if (moved) return; const b = e.target.closest('button[data-i]'); if (b) openViewer(groups[cur].items, Number(b.dataset.i)); });
  // перетаскивание мышью
  let down = false, sx = 0, sl = 0, moved = false;
  strip.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = strip.scrollLeft; });
  window.addEventListener('pointermove', (e) => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 4) { moved = true; strip.classList.add('is-drag'); } if (moved) strip.scrollLeft = sl - dx; });
  window.addEventListener('pointerup', () => { if (!down) return; down = false; strip.classList.remove('is-drag'); setTimeout(() => { moved = false; }, 0); });
  window.addEventListener('resize', edges);
  fill(0);
}

function mount() {
  document.querySelectorAll('[data-gallery]').forEach((host) => {
    const key = host.getAttribute('data-gallery');
    if (host.dataset.ready === key && host.firstChild) return;
    const data = gallery[key];
    if (!data) return; // рантайм ещё не подставил значение
    host.dataset.ready = key;
    build(host, data);
  });
}
mount();
new MutationObserver(mount).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-gallery'] });
