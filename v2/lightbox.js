// Увеличение картинки для карусели и /works.
// Картинка плавно «вырастает» из миниатюры, фон затемняется. Клик вне картинки или Esc возвращают обратно.
const EASE = 'cubic-bezier(.22, 1, .36, 1)';
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

let active = false;

// from/to: прямоугольники миниатюры и увеличенной картинки -> transform для WAAPI
function flip(from, to) {
  const sx = from.width / to.width, sy = from.height / to.height;
  return `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${sx}, ${sy})`;
}

export async function openLightbox(thumb, { src, alt = '' }, { onOpen, onClose } = {}) {
  if (active) return;
  active = true;

  const dlg = document.createElement('dialog');
  dlg.className = 'lightbox';
  dlg.setAttribute('aria-label', alt);
  const img = new Image();
  img.alt = alt;
  img.src = src;
  dlg.appendChild(img);
  document.body.appendChild(dlg);
  try { await img.decode(); } catch { /* покажем как есть */ }

  document.documentElement.classList.add('lb-open');
  if (onOpen) onOpen();
  dlg.showModal();

  const thumbImg = thumb.querySelector('img') || thumb;
  const to = img.getBoundingClientRect();
  if (!reduce()) {
    img.animate([{ transform: flip(thumbImg.getBoundingClientRect(), to), transformOrigin: '0 0' }, { transform: 'none', transformOrigin: '0 0' }], { duration: 520, easing: EASE });
  }

  let closing = false;
  async function close() {
    if (closing) return;
    closing = true;
    dlg.classList.add('is-closing');
    if (!reduce()) {
      const now = img.getBoundingClientRect();
      const a = img.animate([{ transform: 'none', transformOrigin: '0 0' }, { transform: flip(thumbImg.getBoundingClientRect(), now), transformOrigin: '0 0' }], { duration: 420, easing: EASE, fill: 'forwards' });
      // Страховка по таймеру: если кадры не рисуются (скрытая вкладка), окно всё равно закроется.
      try { await Promise.race([a.finished, new Promise((r) => setTimeout(r, 520))]); } catch {}
    }
    dlg.close();
    dlg.remove();
    document.documentElement.classList.remove('lb-open');
    active = false;
    try { thumb.focus({ preventScroll: true }); } catch {}
    if (onClose) onClose();
  }

  // Клик вне картинки (по затемнённому фону) закрывает; Esc тоже, но плавно.
  dlg.addEventListener('click', (e) => { if (e.target !== img) close(); });
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
}
