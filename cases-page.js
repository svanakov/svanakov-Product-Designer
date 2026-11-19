// Страница «Кейсы»: все кейсы карточками, как на главной, в два столбца.
import { t, pick, getLang } from './site.js';
import { cases } from './data/cases.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (id) => document.getElementById(id);

function renderCases(lang) {
  // Та же карточка, что на главной: обложка в рамке, название, описание, теги
  $('wp-cases').innerHTML = cases.map((c) => {
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
      ? `<article class="case-card is-soon"><div class="case-card__link">${inner}</div></article>`
      : `<article class="case-card"><a class="case-card__link" href="${esc(c.href)}">${inner}</a></article>`;
  }).join('');
}

function render() {
  const lang = getLang();
  renderCases(lang);
  document.title = t('cases.title', lang) + ' — ' + t('site.name', lang);
}
render();
document.addEventListener('langchange', render);
