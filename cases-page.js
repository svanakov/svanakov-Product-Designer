// Страница «Кейсы»: все кейсы карточками, как на главной, в два столбца.
import { t, pick, getLang } from './site.js';
import { cases } from './data/cases.js';
import { setMobileMenu } from './mobile-menu.js';
import { mountContactsSection } from './contacts.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (id) => document.getElementById(id);

function renderCases(lang) {
  // Та же карточка, что на главной: обложка в рамке, название, описание, теги
  $('wp-cases').innerHTML = cases.map((c, i) => {
    const inner = `
        <div class="case-card__cover">${c.cover ? `<img src="${esc(c.cover)}" alt="" loading="lazy">` : ''}${c.logo ? `<span class="case-card__logo"><img src="${esc(c.logo)}" alt=""></span>` : ''}${c.soon ? `<span class="case-card__soon">${esc(t('cases.soon', lang))}</span>` : ''}</div>
        <div class="case-card__body">
          <div class="case-card__head">
            <h3 class="case-card__title">${esc(pick(c.title, lang))}</h3>
            ${c.year ? `<span class="case-card__year">${esc(c.year)}</span>` : ''}
          </div>
          <p class="case-card__text">${esc(pick(c.tagline, lang))}</p>
          <ul class="case-card__stack">${(c.stack || []).map((s) => `<li>${esc(pick(s, lang))}</li>`).join('')}</ul>
        </div>`;
    // Кейс «Скоро»: не ссылка, при наведении на обложку появляется метка
    return c.soon
      ? `<article class="case-card is-soon" style="--i:${i}"><div class="case-card__link">${inner}</div></article>`
      : `<article class="case-card" style="--i:${i}"><a class="case-card__link" href="${esc(c.href)}">${inner}</a></article>`;
  }).join('');
}

function render() {
  const lang = getLang();
  renderCases(lang);
  // Телефон: в бургере только тема, язык и контакты
  setMobileMenu({ links: [], homeLink: true, compact: true, cv: null, contacts: true, getActive: () => -1 });
  document.title = t('cases.title', lang) + ' — ' + t('site.name', lang);
  equalize(); stack();
}

// ---- Телефон: карточки стопкой, как на главной (липнут к верху, следующая наезжает на предыдущую) ----
const stackMQ = matchMedia('(max-width: 720px) and (prefers-reduced-motion: no-preference)');
const STACK_TOP = 80, STACK_GAP = 40; // совпадают с site.css
const cardsEl = () => [...document.querySelectorAll('#wp-cases .case-card')];
function equalize() { // у липких карточек одинаковая высота, иначе более высокая выглядывает из-под следующей
  const cards = cardsEl(); cards.forEach((c) => { c.style.height = ''; });
  if (!stackMQ.matches || !cards.length) return;
  const h = Math.ceil(Math.max(...cards.map((c) => c.offsetHeight)));
  cards.forEach((c) => { c.style.height = `${h}px`; });
}
function stack() {
  const cards = cardsEl();
  if (!stackMQ.matches) { cards.forEach((c) => c.style.removeProperty('--p')); return; }
  cards.forEach((c, i) => {
    const next = cards[i + 1]; let p = 0;
    if (next) p = 1 - Math.min(1, Math.max(0, (next.getBoundingClientRect().top - STACK_TOP) / (c.offsetHeight + STACK_GAP)));
    c.style.setProperty('--p', p.toFixed(3));
  });
}
let tick = 0;
addEventListener('scroll', () => { if (!tick) tick = requestAnimationFrame(() => { tick = 0; stack(); }); }, { passive: true });
addEventListener('resize', () => { equalize(); stack(); });
addEventListener('load', () => { equalize(); stack(); });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { equalize(); stack(); });
stackMQ.addEventListener('change', () => { equalize(); stack(); });
render();
document.addEventListener('langchange', render);

// Контакты внизу страницы (как на главной)
mountContactsSection(document.querySelector('main.wp') || document.body);
