// Контакты: строки как на главной (иконка, название, стрелка, кнопка копирования или скачивания) и копирование по кнопке.
// Используется на главной и в конце страниц кейсов.
import { t, getLang, TG_URL, MAIL, CV_URL } from './site.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const COPY_ICON = '<svg class="ic-copy" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15"/></svg><svg class="ic-done" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const CONTACT_ICONS = {
  telegram: '<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>',
  email: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  phone: '<path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/>',
  cv: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
};
const contactIcon = (k) => `<svg class="big-link__ico" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${CONTACT_ICONS[k]}</svg>`;
export const DOWNLOAD_ICON = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V3"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/></svg>';
export function contactRows(lang) {
  const arrow = '<span class="big-link__arrow" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18L18 6M8.5 6H18v9.5"/></svg></span>';
  const row = (href, label, kind, value, ext, icon, dl) => `
    <div class="big-link">
      <a class="big-link__main" href="${href}"${ext ? ' target="_blank" rel="noopener"' : ''}><span class="big-link__label">${contactIcon(icon)}<span>${esc(label)}</span></span>${arrow}</a>
      ${kind
        ? `<span class="copy-wrap"><button type="button" class="copy-btn" data-copy="${esc(value)}" data-kind="${kind}" aria-label="${esc(t('contact.copy.' + kind, lang))}" title="${esc(t('contact.copy.' + kind, lang))}">${COPY_ICON}</button><span class="copy-tip" aria-hidden="true"></span></span>`
        : dl ? `<span class="copy-wrap"><a class="dl-btn" href="${dl}" download="Sergei_Vanakov_CV.pdf" aria-label="${esc(t('contact.download', lang))}" title="${esc(t('contact.download', lang))}">${DOWNLOAD_ICON}</a></span>`
        : '<span class="copy-wrap copy-wrap--empty" aria-hidden="true"></span>'}
    </div>`;
  return (
    row(TG_URL, t('contact.telegram', lang), 'telegram', '@babyoslik', true, 'telegram') +
    row(`mailto:${MAIL}`, t('contact.email', lang), 'email', MAIL, false, 'email') +
    row('tel:+79065327822', t('contact.phone', lang), 'phone', '+7 (906) 532 78-22', false, 'phone') +
    row(CV_URL, t('contact.cv', lang), null, '', true, 'cv', './uploads/Sergei_Vanakov_CV.pdf')
  );
}

// Копирование контакта: клик по самой строке открывает контакт, кнопка справа копирует и показывает подсказку.
export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* нет доступа к буферу, пробуем старый способ */ }
  const ta = document.createElement('textarea');
  ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
  document.body.appendChild(ta); ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch { ok = false; }
  ta.remove();
  return ok;
}
export function setupCopy(container) {
  const timers = new WeakMap();
  container.addEventListener('click', async (e) => {
    const btn = e.target.closest('.copy-btn'); if (!btn) return;
    const ok = await copyText(btn.dataset.copy);
    const wrap = btn.closest('.copy-wrap'), tip = wrap.querySelector('.copy-tip');
    tip.textContent = ok ? t('contact.copied.' + btn.dataset.kind) : t('contact.copy.' + btn.dataset.kind);
    wrap.classList.toggle('is-failed', !ok);
    wrap.classList.add('is-shown'); btn.classList.toggle('is-done', ok);
    const live = document.getElementById('copy-status'); if (live) live.textContent = tip.textContent;
    clearTimeout(timers.get(wrap));
    timers.set(wrap, setTimeout(() => { wrap.classList.remove('is-shown'); btn.classList.remove('is-done'); }, 2000));
  });
}


// Раздел «Связаться со мной» внизу страницы «Все кейсы»: те же строки, что на главной.
export function mountContactsSection(host) {
  const lang = getLang();
  const sec = document.createElement('section');
  sec.className = 'wp__sec'; sec.id = 'contact';
  sec.innerHTML = `<h2 class="section__title">${esc(t('contact.title', lang))}</h2>
    <div class="sr-only" id="copy-status" role="status" aria-live="polite"></div>
    <div class="big-links" id="big-links">${contactRows(lang)}</div>`;
  setupCopy(sec.querySelector('.big-links'));
  host.appendChild(sec);
  return sec;
}
