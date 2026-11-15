// Главная v2: отрисовка секций из data/*.js и поведение карусели.
import { cases } from './data/cases.js';
import { works } from './data/works.js';
import { experience, stack } from './data/experience.js';
import { t, pick, getLang, applyI18n, setTodo, FLAGS, CV_URL, TG_URL, MAIL } from './site.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (id) => document.getElementById(id);

function renderCases(lang) {
  $('cases-list').innerHTML = cases.map((c, i) => `
    <article class="case-card" id="case-${esc(c.slug)}" style="--i:${i}">
      <a class="case-card__link" href="${esc(c.href)}" data-case="${esc(c.slug)}">
        <div class="case-card__cover"><img src="${esc(c.cover)}" alt="" loading="lazy"></div>
        <div class="case-card__body">
          <div class="case-card__meta"><span>${esc(pick(c.domain, lang))}</span><span>${esc(t('cases.kind.' + c.kind, lang))}</span></div>
          <h3 class="case-card__title">${esc(pick(c.title, lang))}</h3>
          <div><p class="case-card__label">${esc(t('cases.problem', lang))}</p><p class="case-card__text">${esc(pick(c.problem, lang))}</p></div>
          <div><p class="case-card__label">${esc(t('cases.result', lang))}</p><p class="case-card__text">${esc(pick(c.result, lang))}<span class="case-card__note">${esc(pick(c.resultNote, lang))}</span></p></div>
          <span class="case-card__btn">${esc(t('cases.more', lang))} <span aria-hidden="true">→</span></span>
        </div>
      </a>
    </article>`).join('');
}

function renderWorks(lang) {
  $('works-carousel').innerHTML = works.map((w) => `
    <li class="carousel__item"><figure style="margin:0">
      <img src="${esc(w.src)}" width="${w.w}" height="${w.h}" alt="${esc(pick(w.alt, lang))}" loading="lazy">
      <figcaption class="${pick(w.caption, lang).startsWith('TODO') ? 'todo' : ''}">${esc(pick(w.caption, lang))}</figcaption>
    </figure></li>`).join('');
  updateCarouselButtons();
}

function renderExperience(lang) {
  $('timeline').innerHTML = experience.map((e) => `
    <li>
      <div class="timeline__period ${pick(e.period, lang).startsWith('TODO') ? 'todo' : ''}">${esc(pick(e.period, lang))}</div>
      <div class="timeline__role ${pick(e.role, lang).startsWith('TODO') ? 'todo' : ''}">${esc(pick(e.role, lang))}</div>
      <div class="timeline__domain ${pick(e.domain, lang).startsWith('TODO') ? 'todo' : ''}">${esc(pick(e.domain, lang))}</div>
      <ul>${e.results.map((r) => `<li class="${pick(r, lang).startsWith('TODO') ? 'todo' : ''}">${esc(pick(r, lang))}</li>`).join('')}</ul>
    </li>`).join('');
  $('stack').innerHTML = stack.map((g) => `
    <div class="stack__group"><h4>${esc(t('stack.' + g.key, lang))}</h4>
      <ul class="stack__items">${g.items.map((i) => { const s = pick(i, lang); return `<li class="${s.startsWith('TODO') ? 'todo' : ''}">${esc(s)}</li>`; }).join('')}</ul>
    </div>`).join('');
}

function renderContact(lang) {
  const arrow = '<span aria-hidden="true">↗</span>';
  $('big-links').innerHTML = `
    <a href="${TG_URL}" target="_blank" rel="noopener"><span>${esc(t('contact.telegram', lang))}</span><small>@svanakov</small>${arrow}</a>
    <a href="mailto:${MAIL}"><span>${esc(t('contact.email', lang))}</span><small>${MAIL}</small>${arrow}</a>
    <a href="${CV_URL}" target="_blank" rel="noopener"><span>${esc(t('contact.cv', lang))}</span>${arrow}</a>`;
}

function renderFooter(lang) {
  const nav = ['cases', 'works', 'workflow', 'about', 'experience'].map((id) => `<a href="#${id}">${esc(t('nav.' + id, lang))}</a>`).join('');
  $('site-footer').innerHTML = `
    <div class="container site-footer__row">
      <nav aria-label="${esc(t('nav.main', lang))}">${nav}<a href="${CV_URL}" target="_blank" rel="noopener">CV</a></nav>
      <div class="lang"><button type="button" data-lang="ru">RU</button><span aria-hidden="true">/</span><button type="button" data-lang="en">EN</button></div>
      <span class="site-footer__copy">© ${new Date().getFullYear()} ${esc(t('footer.rights', lang))} · ${esc(t('footer.location', lang))}</span>
    </div>`;
}

// Карусель: стрелки листают на ширину видимой области, клавиатура работает на самом списке.
function updateCarouselButtons() {
  const el = $('works-carousel'), prev = $('works-prev'), next = $('works-next');
  if (!el || !prev) return;
  prev.disabled = el.scrollLeft <= 2;
  next.disabled = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
}
function setupCarousel() {
  const el = $('works-carousel');
  const by = (dir) => el.scrollBy({ left: dir * Math.max(240, el.clientWidth * 0.8), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  $('works-prev').addEventListener('click', () => by(-1));
  $('works-next').addEventListener('click', () => by(1));
  el.addEventListener('scroll', updateCarouselButtons, { passive: true });
  el.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); by(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); by(-1); }
  });
  window.addEventListener('resize', updateCarouselButtons);
}

// ---- Стопка карточек: прогресс --p и счётчик ----
const STACK_TOP = 112, STACK_STEP = 14, STACK_GAP = 32; // совпадают с site.css
const stackMQ = matchMedia('(prefers-reduced-motion: no-preference) and (min-height: 701px)');
const pad = (n) => String(n).padStart(2, '0');
function updateStack() {
  const cards = [...document.querySelectorAll('.case-card')];
  if (!cards.length) return;
  if (!stackMQ.matches) { cards.forEach((c) => c.style.removeProperty('--p')); return; }
  let active = 0;
  cards.forEach((card, i) => {
    const next = cards[i + 1];
    let p = 0;
    if (next) {
      const travel = next.getBoundingClientRect().top - (STACK_TOP + (i + 1) * STACK_STEP);
      p = 1 - Math.min(1, Math.max(0, travel / (card.offsetHeight + STACK_GAP)));
    }
    card.style.setProperty('--p', p.toFixed(3));
    if (card.getBoundingClientRect().top <= STACK_TOP + i * STACK_STEP + 60) active = i;
  });
  const counter = $('cases-counter');
  const text = `${pad(active + 1)} / ${pad(cards.length)}`;
  if (counter && counter.textContent !== text) counter.textContent = text;
}
function setupStack() {
  window.addEventListener('scroll', updateStack, { passive: true });
  window.addEventListener('resize', updateStack);
  stackMQ.addEventListener('change', updateStack);
  updateStack();
}

// ---- Возврат со страницы кейса: восстановить прокрутку к тому же месту ----
// Браузерное восстановление отключаем: карточки рисуются скриптом, и оно срабатывает до нужной высоты страницы.
const SCROLL_KEY = 'v2:home-scroll';
function setupScrollRestore() {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const read = () => { try { return JSON.parse(sessionStorage.getItem(SCROLL_KEY) || 'null'); } catch { return null; } };
  const write = (o) => { try { sessionStorage.setItem(SCROLL_KEY, JSON.stringify(o)); } catch {} };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-case]');
    if (a) write({ y: window.scrollY, slug: a.dataset.case });
  });
  window.addEventListener('pagehide', () => write({ ...(read() || {}), y: window.scrollY }));
  const type = (performance.getEntriesByType('navigation')[0] || {}).type;
  if (type !== 'back_forward' && type !== 'reload') return;
  const s = read();
  if (!s || typeof s.y !== 'number' || location.hash) return;
  const go = () => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, s.y); document.documentElement.style.scrollBehavior = ''; updateStack(); };
  go();
  window.addEventListener('load', go, { once: true }); // высота могла измениться после загрузки картинок
}

function renderAll() {
  const lang = getLang();
  renderCases(lang); renderWorks(lang); renderExperience(lang); renderContact(lang); renderFooter(lang);
  applyI18n(document, lang);
  $('chip-video').hidden = !FLAGS.VIDEO;
  $('chip-assistant').hidden = !FLAGS.ASSISTANT_ENABLED;
  $('assistant').hidden = !FLAGS.ASSISTANT_ENABLED;
  updateStack();
}

renderAll();
setupCarousel();
setupStack();
setupScrollRestore();
document.addEventListener('langchange', renderAll);
