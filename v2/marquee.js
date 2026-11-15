// Бесконечная лента работ на главной: медленно едет справа налево, края плавно растворяются (маска в CSS).
// Останавливается плавно (без рывков): при наведении мыши, при фокусе с клавиатуры и при открытой картинке.
// Пока курсор над лентой, её можно листать жестами: горизонтальным скроллом тачпада или колеса и перетаскиванием.
// Курсор ушёл за пределы ленты: она плавно трогается и едет дальше с того места, где остановилась.
// После закрытия картинки лента снова едет, как только курсор вне ленты.
// При prefers-reduced-motion движения нет, лента просто листается пальцем или колесом.
import { works } from './data/works.js';
import { pick, getLang } from './site.js';
import { openLightbox } from './lightbox.js';

const SPEED = 32;                 // px/с, скорость движения
const EASING = 4;                 // чем больше, тем быстрее разгон и торможение

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function mountMarquee(root) {
  const track = root.querySelector('.marquee__track');
  const n = works.length;
  let x = 0, v = 0, setW = 0, raf = 0, last = 0;
  let hover = false, focused = false, lbOpen = false;
  let dragging = false, dragMoved = 0, lastPX = 0, suppressClick = false;
  const isStatic = reduce();

  const paused = () => hover || focused || lbOpen || dragging;
  const wrap = () => { if (setW > 0) { while (x <= -setW) x += setW; while (x > 0) x -= setW; } };
  const paint = () => { track.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`; };
  // Ручное листание: сдвигаем ленту на dx пикселей, лента замкнута в кольцо
  const shift = (dx) => { x += dx; wrap(); paint(); };

  function itemHtml(w, lang, clone) {
    const alt = pick(w.alt, lang);
    return `<button type="button" class="marquee__item" data-id="${w.id}" aria-label="${esc(alt)}"${clone ? ' tabindex="-1" aria-hidden="true"' : ''}>
      <img src="${esc(w.src)}" width="${w.w}" height="${w.h}" alt="" draggable="false"></button>`;
  }
  function appendSet(lang, clone) { track.insertAdjacentHTML('beforeend', works.map((w) => itemHtml(w, lang, clone)).join('')); }

  function measure() {
    if (isStatic || track.children.length < n + 1) return;
    setW = track.children[n].offsetLeft - track.children[0].offsetLeft;
    if (!setW) return;
    // Копий должно хватать на ширину экрана плюс запас на сдвиг, иначе справа появится пустота.
    const need = Math.ceil(root.clientWidth / setW) + 1;
    while (track.children.length / n < need) appendSet(getLang(), true);
  }

  function build() {
    const lang = getLang();
    track.textContent = '';
    appendSet(lang, false);
    root.classList.toggle('is-static', isStatic);
    if (!isStatic) { appendSet(lang, true); measure(); }
    x = 0; v = 0;
    track.style.transform = '';
    ensure();
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const target = paused() ? 0 : SPEED;
    v += (target - v) * (1 - Math.exp(-dt * EASING));
    if (target === 0 && v < 0.05) { v = 0; raf = 0; return; } // полностью остановились, цикл не крутим вхолостую
    x -= v * dt;
    wrap();
    paint();
    raf = requestAnimationFrame(frame);
  }
  function ensure() {
    if (isStatic || raf) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  // Мышь: пока курсор над лентой, она плавно замирает (чтобы можно было навести и нажать).
  root.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') hover = true; });
  root.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { hover = false; ensure(); } });
  // Клавиатура: пока фокус на картинке, лента стоит, а сама картинка сдвигается в видимую область.
  root.addEventListener('focusin', (e) => {
    const b = e.target.closest('.marquee__item'); if (!b) return;
    // Только фокус с клавиатуры. Фокус, который вернулся на миниатюру после закрытия картинки мышью, ленту не держит.
    if (!b.matches(':focus-visible')) return;
    focused = true;
    const r = b.getBoundingClientRect();
    if (r.left < 0 || r.right > window.innerWidth) { x -= r.left + r.width / 2 - window.innerWidth / 2; wrap(); paint(); }
  });
  root.addEventListener('focusout', () => { focused = false; ensure(); });

  if (!isStatic) {
    // Горизонтальный жест тачпада или Shift+колесо листают ленту; вертикальный скролл остаётся за страницей.
    root.addEventListener('wheel', (e) => {
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : (e.shiftKey ? e.deltaY : 0);
      if (!d) return;
      e.preventDefault();
      shift(-d);
    }, { passive: false });
    // Перетаскивание мышью или пальцем
    root.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      dragging = true; dragMoved = 0; lastPX = e.clientX; v = 0;
    });
    root.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastPX; lastPX = e.clientX; dragMoved += Math.abs(dx);
      if (dragMoved > 5) {
        if (!root.classList.contains('is-dragging')) { root.classList.add('is-dragging'); try { root.setPointerCapture(e.pointerId); } catch {} }
        shift(dx);
      }
    });
    const endDrag = () => {
      if (!dragging) return;
      dragging = false; root.classList.remove('is-dragging');
      if (dragMoved > 5) { suppressClick = true; setTimeout(() => { suppressClick = false; }, 0); } // после перетаскивания клик не открывает картинку
      ensure();
    };
    root.addEventListener('pointerup', endDrag);
    root.addEventListener('pointercancel', endDrag);
  }

  root.addEventListener('click', (e) => {
    if (suppressClick) return;
    const b = e.target.closest('.marquee__item'); if (!b) return;
    const w = works.find((k) => k.id === b.dataset.id); if (!w) return;
    v = 0; // замираем сразу, чтобы увеличение вышло ровно из миниатюры
    openLightbox(b, { src: w.src, alt: pick(w.alt, getLang()) }, {
      onOpen: () => { lbOpen = true; },
      onClose: () => { lbOpen = false; ensure(); },
    });
  });

  window.addEventListener('resize', measure);
  root.addEventListener('load', measure, true); // размеры картинок могли уточниться после загрузки
  document.addEventListener('langchange', build);
  build();
}
