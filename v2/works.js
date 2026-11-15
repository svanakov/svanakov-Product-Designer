// Страница /works: сетка работ и лайтбокс на нативном <dialog> (Esc и фокус работают сами).
import { works } from './data/works.js';
import { pick, getLang } from './site.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const grid = document.getElementById('works-grid');
const box = document.getElementById('lightbox');
const bigImg = document.getElementById('lightbox-img');
const bigCap = document.getElementById('lightbox-cap');

function render() {
  const lang = getLang();
  grid.innerHTML = works.map((w) => {
    const cap = pick(w.caption, lang);
    return `<figure>
      <button type="button" data-id="${w.id}" aria-label="${esc(cap)}"><img src="${esc(w.src)}" width="${w.w}" height="${w.h}" alt="${esc(pick(w.alt, lang))}" loading="lazy"></button>
      <figcaption class="${cap.startsWith('TODO') ? 'todo' : ''}">${esc(cap)}</figcaption>
    </figure>`;
  }).join('');
}

grid.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-id]');
  if (!btn) return;
  const w = works.find((x) => x.id === btn.dataset.id);
  const lang = getLang();
  bigImg.src = w.src; bigImg.alt = pick(w.alt, lang); bigCap.textContent = pick(w.caption, lang);
  box.setAttribute('aria-label', pick(w.caption, lang));
  box.showModal();
});
box.addEventListener('click', (e) => { if (e.target === box || e.target.closest('#lightbox-close')) box.close(); });
document.addEventListener('langchange', render);
render();
