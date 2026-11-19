// Страница «Кейсы»: все кейсы карточками, как на главной, в два столбца.
import { t, pick, getLang } from './site.js';
import { cases } from './data/cases.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (id) => document.getElementById(id);

function renderCases(lang) {
  // Та же карточка, что на главной: обложка в рамке, название, описание, теги
  $('wp-cases').innerHTML = cases.map((c) => `
    <article class="case-card">
      <a class="case-card__link" href="${esc(c.href)}">
        <div class="case-card__cover"><img src="${esc(c.cover)}" alt="" loading="lazy"></div>
        <div class="case-card__body">
          <div class="case-card__head">
            <h3 class="case-card__title">${esc(pick(c.title, lang))}</h3>
            ${c.year ? `<span class="case-card__year">${esc(c.year)}</span>` : ''}
          </div>
          <p class="case-card__text">${esc(pick(c.tagline, lang))}</p>
          <ul class="case-card__stack">${(c.stack || []).map((s) => `<li>${esc(pick(s, lang))}</li>`).join('')}</ul>
        </div>
      </a>
    </article>`).join('');
}

function render() {
  const lang = getLang();
  renderCases(lang);
  document.title = t('cases.title', lang) + ' — ' + t('site.name', lang);
}
render();
document.addEventListener('langchange', render);
