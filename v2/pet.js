// Пиксельный питомец-облачко в углу экрана: рисуется точками на канвасе (20x13 «пикселей»).
// Моргает, следит за курсором, комментирует разделы, подпрыгивает по клику, засыпает без активности.
// Питомца можно брать и перетаскивать по странице (он комментирует это). Скрыть его нельзя.
// Только десктоп, при prefers-reduced-motion без движений.
import { getLang } from './site.js';
import { createSprite, W, H, isDark } from './pet-sprite.js';

const SCALE = 5;

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
if (matchMedia('(min-width: 1100px) and (hover: hover) and (pointer: fine)').matches) start();

function start() {
  // ---------- DOM ----------
  const el = document.createElement('div');
  el.className = 'pet';
  el.innerHTML = '<div class="pet__say" hidden><span class="pet__t"></span></div><canvas class="pet__c" width="' + W + '" height="' + H + '" aria-hidden="true"></canvas><span class="pet__z" aria-hidden="true" hidden>z z z</span>';
  document.body.appendChild(el);
  const canvas = el.querySelector('canvas');
  const sprite = createSprite(canvas); const s = sprite.s; const draw = () => sprite.draw();
  const bubble = el.querySelector('.pet__say'), text = el.querySelector('.pet__t'), zzz = el.querySelector('.pet__z');
  canvas.style.width = W * SCALE + 'px'; canvas.style.height = H * SCALE + 'px';

  const L = {
    ru: { hero: 'Привет! Листай вниз ↓', cases: 'Три кейса. Кликни карточку', works: 'Наведи на ленту: она остановится', workflow: 'Нажми на видео!', experience: 'Тут опыт и навыки', contact: 'Есть вопросы? Спроси ассистента или напиши в Telegram',
          poke: ['Эй!', 'Я просто облачко', 'Хи-хи', 'Привет-привет', 'Ой'], enough: 'Хватит щекотать!', sulk: 'Всё, я обиделся...', night: 'Ночь. Смотри, звёзды', day: 'Снова день', wake: 'Я не спал!', back: 'Я вернулся!', hint: 'Меня можно перетаскивать!', welcomeBack: 'Ура, ты вернулся! Я скучал', walk: ['Пойду прогуляюсь', 'Туда-сюда', 'Разомнусь'],
          pick: ['Ой! Ты меня несёшь!', 'Меня подняли!', 'Куда мы?', 'Ух, я лечу'], carry: ['Уиии!', 'Не урони!', 'Тут высоко', 'Красивый вид', 'Ещё немного...'],
          drop: ['Приземлился', 'Тут уютно', 'Хорошее место', 'Ладно, тут останусь', 'Спасибо!'], top: 'Тут высоко! Я боюсь', home: 'Дома!', dock: 'Тут навигация. Я не мешаю?', again: 'Опять? Мне нравится!' },
    en: { hero: 'Hi! Scroll down ↓', cases: 'Three cases. Click a card', works: 'Hover the strip: it will stop', workflow: 'Click the video!', experience: 'Experience and skills here', contact: 'Questions? Ask the assistant or write on Telegram',
          poke: ['Hey!', 'Just a little cloud', 'Hehe', 'Hello hello', 'Oops'], enough: 'Stop tickling me!', sulk: 'That is it, I am sulking...', night: 'Night. Look, stars', day: 'Day again', wake: 'I was not sleeping!', back: 'I am back!', hint: 'You can drag me around!', welcomeBack: 'Yay, you are back! I missed you', walk: ['Going for a walk', 'Back and forth', 'Stretching my legs'],
          pick: ['Oh! You are carrying me!', 'Picked up!', 'Where are we going?', 'Wow, I am flying'], carry: ['Wheee!', 'Do not drop me!', 'It is high up here', 'Nice view', 'Just a bit more...'],
          drop: ['Landed', 'Cozy here', 'Nice spot', 'OK, I will stay here', 'Thanks!'], top: 'It is high up here! I am scared', home: 'Home!', dock: 'The navigation is here. Am I in the way?', again: 'Again? I like it!' },
  };
  const t = () => L[getLang()];

  // ---------- состояние и отрисовка ----------
  s.sleeping = false;

  // ---------- речь ----------
  let hideTimer = 0, lastSay = 0;
  function say(msg, force) {
    if (away) return; // уехал в чат, говорить некому
    const now = Date.now();
    if (!force && now - lastSay < 6000) return;
    lastSay = now;
    text.textContent = msg; bubble.hidden = false;
    bubble.classList.remove('is-in'); void bubble.offsetWidth; bubble.classList.add('is-in');
    clearTimeout(hideTimer); hideTimer = setTimeout(() => { bubble.hidden = true; }, 5200);
  }

  // ---------- настроение ----------
  let moodTimer = 0;
  function mood(eyes, mouth, ms) {
    s.eyes = eyes; s.mouth = mouth; draw();
    clearTimeout(moodTimer);
    if (ms) moodTimer = setTimeout(() => { s.eyes = s.sleeping ? 'sleep' : 'open'; s.mouth = s.sleeping ? 'flat' : 'smile'; draw(); }, ms);
  }
  function hop() { if (reduce()) return; el.classList.remove('is-hop'); void el.offsetWidth; el.classList.add('is-hop'); }

  // моргание
  const blinkLoop = () => {
    if (!s.sleeping && s.eyes === 'open' && !reduce()) { s.eyes = 'blink'; draw(); setTimeout(() => { if (s.eyes === 'blink') { s.eyes = 'open'; draw(); } }, 140); }
    setTimeout(blinkLoop, 2500 + Math.random() * 3500);
  };

  // сон без активности
  let idleTimer = 0;
  function sleep() { s.sleeping = true; s.eyes = 'sleep'; s.mouth = 'flat'; zzz.hidden = false; draw(); }
  function wake(msg) {
    if (!s.sleeping) return;
    s.sleeping = false; s.eyes = 'open'; s.mouth = 'o'; zzz.hidden = true; draw(); hop();
    setTimeout(() => { s.mouth = 'smile'; draw(); }, 700);
    if (msg) say(t().wake, true);
  }
  const activity = () => { clearTimeout(idleTimer); idleTimer = setTimeout(sleep, 25000); };

  // глаза следят за курсором
  addEventListener('pointermove', (e) => {
    if (s.sleeping) { wake(); }
    activity();
    const r = canvas.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const lx = dx < -90 ? -1 : dx > 90 ? 1 : 0, ly = dy > 90 ? 1 : 0;
    if (lx !== s.lx || ly !== s.ly) { s.lx = lx; s.ly = ly; if (!s.sleeping) draw(); }
  }, { passive: true });
  addEventListener('keydown', () => { activity(); wake(); }, { passive: true });

  // реплики при входе в раздел
  const SECTIONS = [['top', 'hero'], ['cases', 'cases'], ['works', 'works'], ['workflow', 'workflow'], ['experience', 'experience'], ['contact', 'contact']];
  const said = new Set(); let current = '', greeted = false;
  const onScroll = () => {
    activity(); wake();
    let cur = '';
    for (const [id, key] of SECTIONS) { const n = document.getElementById(id); if (n && n.getBoundingClientRect().top <= innerHeight * 0.5) cur = key; }
    // Пока не прозвучало приветствие, раздел только запоминаем: иначе при перезагрузке реплика раздела перебьёт приветствие
    if (cur && cur !== current) { current = cur; if (greeted && !said.has(cur)) { said.add(cur); say(t()[cur]); mood('happy', 'smile', 900); } }
  };
  // Когда долистали до ассистента, питомец «переезжает» в чат: прыгает и уезжает за край, а в чате его двойник здоровается
  let away = false, awayTimer = 0;
  const checkAway = () => {
    const a = document.getElementById('assistant'); if (!a) return;
    const r = a.getBoundingClientRect();
    const near = r.top < innerHeight * 0.8 && r.bottom > innerHeight * 0.2;
    if (!near && !away && el.classList.contains('is-away')) el.classList.remove('is-away'); // страховка: вдали от ассистента питомец всегда на виду
    if (near === away) return;
    away = near;
    if (near) {
      bubble.hidden = true; hop(); mood('happy', 'o', 600);
      clearTimeout(awayTimer);
      awayTimer = setTimeout(() => { if (away) el.classList.add('is-away'); }, reduce() ? 0 : 350); // только если всё ещё у ассистента
      document.dispatchEvent(new CustomEvent('pet:away'));
    } else {
      clearTimeout(awayTimer); // отложенный «уход» отменяем, иначе он сработает уже после возвращения
      el.classList.remove('is-away');
      setTimeout(() => { say(t().back, true); mood('happy', 'smile', 900); hop(); }, reduce() ? 0 : 500);
    }
  };
  addEventListener('scroll', checkAway, { passive: true });
  addEventListener('scroll', onScroll, { passive: true });

  // ---------- перетаскивание ----------
  const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
  let drag = null, suppressClick = false, drags = 0, carry = 0;
  const POS_KEY = 'pet_pos';
  const clamp = (x, y) => [Math.max(8, Math.min(innerWidth - el.offsetWidth - 8, x)), Math.max(8, Math.min(innerHeight - el.offsetHeight - 8, y))];
  const place = (x, y, save) => {
    [x, y] = clamp(x, y);
    el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.bottom = 'auto';
    // пузырь не должен вылезать за экран: у верхнего края он ниже питомца, у правого прижат вправо
    el.classList.toggle('is-top', y < 90); el.classList.toggle('is-right', x > innerWidth - 290);
    if (save) { try { sessionStorage.setItem(POS_KEY, JSON.stringify({ x, y })); } catch {} }
  };
  try { const p = JSON.parse(sessionStorage.getItem(POS_KEY) || 'null'); if (p) place(p.x, p.y); } catch {}
  addEventListener('resize', () => { anchorX = null; if (el.style.top) { const r = el.getBoundingClientRect(); place(r.left, r.top); } });

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const r = el.getBoundingClientRect();
    drag = { dx: e.clientX - r.left, dy: e.clientY - r.top, sx: e.clientX, sy: e.clientY, moved: false };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    if (!drag.moved) {
      if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 5) return;
      drag.moved = true; wake(); activity(); drags++;
      el.classList.add('is-drag'); mood('happy', 'o'); bubble.hidden = true;
      say(drags === 4 ? t().again : rnd(t().pick), true);
      carry = setInterval(() => say(rnd(t().carry), true), 2600);
    }
    place(e.clientX - drag.dx, e.clientY - drag.dy);
  });
  const endDrag = () => {
    if (!drag) return;
    const moved = drag.moved; drag = null;
    if (!moved) return;
    clearInterval(carry);
    el.classList.remove('is-drag'); mood('happy', 'smile', 1100); hop(); activity(); anchorX = null;
    const r = el.getBoundingClientRect();
    place(r.left, r.top, true);
    suppressClick = true; setTimeout(() => { suppressClick = false; }, 0);
    // реплика зависит от места, куда его поставили
    const nearHome = r.left < 120 && innerHeight - r.bottom < 120;
    const nearDock = innerHeight - r.bottom < 110 && Math.abs(r.left + r.width / 2 - innerWidth / 2) < 340;
    say(r.top < 90 ? t().top : nearHome ? t().home : nearDock ? t().dock : rnd(t().drop), true);
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  // ---------- прогулки: пока бездельничает, переступает то влево, то вправо на несколько пикселей ----------
  // Шаги строго чередуются (вправо, потом влево и т. д.), а от места «дома» он удаляется не дальше RANGE пикселей.
  const RANGE = 40;
  let lastDir = Math.random() < 0.5 ? -1 : 1, walking = false, anchorX = null;
  function stroll() {
    if (!drag && !away && !s.sleeping && !walking && !reduce() && !el.classList.contains('is-away')) {
      const r = el.getBoundingClientRect();
      if (anchorX === null) anchorX = r.left; // место, вокруг которого он топчется (после перетаскивания обновляется)
      const dir = -lastDir;
      const min = Math.max(24, anchorX - RANGE), max = Math.min(innerWidth - r.width - 24, anchorX + RANGE);
      const x = Math.max(min, Math.min(max, r.left + dir * (10 + Math.random() * 22)));
      lastDir = dir;
      if (Math.abs(x - r.left) > 4) {
        walking = true;
        s.lx = dir; s.ly = 0; draw();
        el.classList.add('is-walk');
        place(x, r.top);
        if (Math.random() < 0.3) say(rnd(t().walk));
        setTimeout(() => {
          el.classList.remove('is-walk'); walking = false;
          if (!s.sleeping) { s.lx = 0; draw(); }
          const b = el.getBoundingClientRect(); place(b.left, b.top, true);
        }, 1000);
      }
    }
    setTimeout(stroll, 4500 + Math.random() * 5000);
  }
  setTimeout(stroll, 5000);

  // клик: прыжок и реплика
  let pokes = 0;
  canvas.addEventListener('click', () => {
    if (suppressClick) return;
    wake(); activity(); pokes++; hop();
    if (pokes === 3) { say(t().hint, true); mood('happy', 'smile', 900); return; }
    if (pokes === 5) { say(t().enough, true); mood('happy', 'o', 1100); }
    else if (pokes === 9) { say(t().sulk, true); mood('open', 'flat', 1500); setTimeout(sleep, 1600); }
    else { const p = t().poke; say(p[Math.floor(Math.random() * p.length)], true); mood('happy', 'smile', 900); }
  });

  // смена темы: рисует общий модуль, питомец только комментирует
  new MutationObserver(() => { say(isDark() ? t().night : t().day, true); mood('happy', 'smile', 1000); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  draw(); blinkLoop(); activity();
  // Первый визит: приветствует и советует листать вниз. Повторный: радуется, что человек вернулся.
  let seen = false;
  try { seen = localStorage.getItem('pet_seen') === '1'; localStorage.setItem('pet_seen', '1'); } catch {}
  setTimeout(() => {
    greeted = true; said.add('hero'); // приветствие заменяет реплику первого раздела
    if (seen) { say(t().welcomeBack, true); mood('happy', 'o', 1600); hop(); setTimeout(hop, 650); }
    else say(t().hero, true);
    onScroll();
  }, 1400);
}
