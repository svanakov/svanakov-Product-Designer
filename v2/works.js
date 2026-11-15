// Страница /works: сетка работ без подписей. Клик по картинке увеличивает её (общий lightbox.js).
import { works } from './data/works.js';
import { pick, getLang } from './site.js';
import { openLightbox } from './lightbox.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const grid = document.getElementById('works-grid');

function render() {
  const lang = getLang();
  grid.innerHTML = works.map((w) => `<button type="button" data-id="${w.id}" aria-label="${esc(pick(w.alt, lang))}"><img src="${esc(w.src)}" width="${w.w}" height="${w.h}" alt="" loading="lazy"></button>`).join('');
}

grid.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-id]');
  if (!btn) return;
  const w = works.find((x) => x.id === btn.dataset.id);
  openLightbox(btn, { src: w.src, alt: pick(w.alt, getLang()) });
});
document.addEventListener('langchange', render);
render();
