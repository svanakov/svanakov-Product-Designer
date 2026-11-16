// Страница «Кейсы»: все кейсы списком (как в первой версии портфолио), справа точки-индикатор.
import { t, pick, getLang } from './site.js';
import { cases } from './data/cases.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (id) => document.getElementById(id);

// Иконки и цвета тегов, как в первой версии
const TAG_ICONS = {
  'Mobile': 'mobile.svg', 'UX Research': 'ux.svg', 'Product Design': 'product.svg', 'Prototyping': 'prototyping.svg',
  'PWA': 'PWA.svg', 'EdTech': 'Edtech.svg', 'UI Design': 'ui.svg', 'Анализ конкурентов': 'CompetitorsAnalysis.svg',
};
const TAG_COLORS = ['#0080CF', '#A268BA', '#E04541', '#31976B'];

function renderCases(lang) {
  $('wp-cases').innerHTML = cases.map((c, i) => `
    <a class="proj" href="${esc(c.href)}">
      <div class="proj__cover"><img src="${esc(c.cover)}" alt="" loading="lazy"></div>
      <div class="proj__head"><span class="proj__num">${String(i + 1).padStart(2, '0')}</span><h3 class="proj__title">${esc(pick(c.title, lang))}</h3></div>
      <p class="proj__desc">${esc(pick(c.blurb, lang))}</p>
      <ul class="proj__tags">${(c.stack || []).map((s, k) => `<li style="--hc:${TAG_COLORS[k % TAG_COLORS.length]}">${TAG_ICONS[s] ? `<i class="tag-ico" aria-hidden="true" style="--ico:url('../icons/${TAG_ICONS[s]}')"></i>` : ''}<span>${esc(s)}</span></li>`).join('')}</ul>
    </a>`).join('') + `<div class="wp-dots"><div class="wp-dots__rail">${cases.map((c, i) => `<button type="button" data-i="${i}" aria-label="${esc(pick(c.title, lang))}"></button>`).join('')}</div></div>`;
}

function render() {
  const lang = getLang();
  renderCases(lang);
  document.title = t('cases.title', lang) + ' — ' + t('site.name', lang);
}
render();
document.addEventListener('langchange', render);

// Точки справа от кейсов, как на главной: горит точка кейса, который сейчас на экране
function dots() {
  const projs = [...document.querySelectorAll('.proj')], ds = [...document.querySelectorAll('.wp-dots button')];
  if (!projs.length || !ds.length) return;
  let active = 0;
  projs.forEach((p, i) => { if (p.getBoundingClientRect().top <= innerHeight * 0.5) active = i; });
  ds.forEach((d, i) => d.classList.toggle('is-active', i === active));
}
addEventListener('scroll', dots, { passive: true }); addEventListener('resize', dots); dots();
document.addEventListener('langchange', dots);

// Клик по точке плавно прокручивает к кейсу
$('wp-cases').addEventListener('click', (e) => {
  const b = e.target.closest('.wp-dots button'); if (!b) return;
  const p = document.querySelectorAll('.proj')[Number(b.dataset.i)]; if (!p) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: p.getBoundingClientRect().top + scrollY - 110, behavior: reduce ? 'auto' : 'smooth' });
});
