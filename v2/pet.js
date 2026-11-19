// Пиксельный питомец-облачко в углу экрана: рисуется точками на канвасе (20x13 «пикселей»).
// Моргает, следит за курсором, комментирует разделы, подпрыгивает по клику, засыпает без активности.
// Питомца можно брать и перетаскивать по странице (он комментирует это). Кнопка-крестик при наведении убирает его со страницы
// вместе со звездой внизу, но только до перезагрузки: при следующей загрузке облачко появляется снова.
// Только десктоп, при prefers-reduced-motion без движений.
import { getLang } from './site.js';
import { createSprite, W, H, isDark } from './pet-sprite.js';

const SCALE = 5;

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
try { localStorage.removeItem('pet_off'); } catch { /* storage недоступен */ } // старый флаг из прошлой версии: облачко возвращается при каждой загрузке
if (matchMedia('(min-width: 1100px) and (hover: hover) and (pointer: fine)').matches) start();

function start() {
  let feeding = false;

  // ---------- DOM ----------
  const el = document.createElement('div');
  el.className = 'pet';
  el.innerHTML = '<div class="pet__say" hidden><span class="pet__t"></span></div><span class="pet__b"><canvas class="pet__c" width="' + W + '" height="' + H + '" aria-hidden="true"></canvas><span class="pet__flare" aria-hidden="true"></span></span><button type="button" class="pet__x" aria-label="' + (getLang() === 'en' ? 'Hide the little cloud' : 'Убрать облачко') + '"><svg width="14" height="14" viewBox="0 0 7 7" shape-rendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="M0 0h1v1H0zM6 0h1v1H6zM1 1h1v1H1zM5 1h1v1H5zM2 2h1v1H2zM4 2h1v1H4zM3 3h1v1H3zM2 4h1v1H2zM4 4h1v1H4zM1 5h1v1H1zM5 5h1v1H5zM0 6h1v1H0zM6 6h1v1H6z"/></svg></button><span class="pet__z" aria-hidden="true" hidden>z z z</span>';
  document.body.appendChild(el);
  el.classList.add('is-right'); // стоит справа внизу: пузырь прижат к правому краю
  const canvas = el.querySelector('canvas');
  const sprite = createSprite(canvas); const s = sprite.s; const draw = () => sprite.draw();
  const bubble = el.querySelector('.pet__say'), text = el.querySelector('.pet__t'), zzz = el.querySelector('.pet__z');
  canvas.style.width = W * SCALE + 'px'; canvas.style.height = H * SCALE + 'px';

  const L = {
    ru: { hero: 'Привет! Листай вниз ↓',
          poke: ['Да?', 'Я здесь', 'Заметил', 'Слушаю внимательно', 'Щёлк', 'Чем могу помочь?', 'Там, кстати, кейсы'], enough: 'Ладно-ладно, достаточно', sulk: 'Всё, ухожу в спящий режим', rainSay: 'Облачно, возможны осадки', night: 'Ночь. Смотри, звёзды', day: 'Снова день', wake: 'Я не спал!', back: 'Я вернулся!', hint: 'Меня можно перетаскивать', treatCap: 'Покорми облачко', treatNudge: 'Перетащи звезду ко мне', nyam: 'Вкусно', treatBeg: 'Звезда ещё ждёт', treatHint: 'Звезда для облачка', thanks: 'Спасибо, это было вкусно', thanks2: 'Теперь я сияю', welcomeBack: 'С возвращением', walk: ['Разомну пиксели', 'Небольшая прогулка', 'Осматриваюсь'],
          pick: ['Меня подняли', 'Летим', 'Куда едем?'], carry: ['Осторожно', 'Тут высоко', 'Вид неплохой', 'Главное, не уронить', 'Держим курс'],
          drop: ['Хорошее место', 'Отсюда видно лучше', 'Тут нормально', 'Спасибо, дальше сам'], top: 'Потолок. Выше только небо', home: 'Вернулся на своё место', dock: 'Тут навигация, я отойду', again: 'Мы так до утра' },
    en: { hero: 'Hi! Scroll down ↓',
          poke: ['Yes?', 'I am here', 'Noticed that', 'Listening closely', 'Click', 'How can I help?', 'By the way, the cases are down there'], enough: 'Okay, okay, that is enough', sulk: 'That is it, going to sleep mode', rainSay: 'Cloudy, chance of showers', night: 'Night. Look, stars', day: 'Day again', wake: 'I was not sleeping!', back: 'I am back!', hint: 'You can drag me around', treatCap: 'Feed the little cloud', treatNudge: 'Drag the star to me', nyam: 'Tasty', treatBeg: 'The star is still waiting', treatHint: 'A star for the little cloud', thanks: 'Thank you, that was tasty', thanks2: 'Now I am shining', welcomeBack: 'Welcome back', walk: ['Stretching my pixels', 'A short walk', 'Looking around'],
          pick: ['Picked up', 'Flying', 'Where are we going?'], carry: ['Careful', 'It is high up here', 'Nice view', 'Just do not drop me', 'Holding course'],
          drop: ['Good spot', 'The view is better from here', 'This is fine', 'Thanks, I will take it from here'], top: 'The ceiling. Only sky above', home: 'Back in my spot', dock: 'The navigation is here, I will move', again: 'We could do this until morning' },
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
  const SECTIONS = [['top', 'hero'], ['cases', 'cases'], ['workflow', 'workflow'], ['experience', 'experience'], ['contact', 'contact']];
  const said = new Set(); let current = '', greeted = false;
  const onScroll = () => {
    activity(); wake();
    let cur = '';
    for (const [id, key] of SECTIONS) { const n = document.getElementById(id); if (n && n.getBoundingClientRect().top <= innerHeight * 0.5) cur = key; }
    // Реагирует только на ленту работ (для остальных разделов реплик нет). Пока не прозвучало приветствие, раздел только запоминаем: иначе при перезагрузке реплика раздела перебьёт приветствие
    if (cur && cur !== current) { current = cur; if (greeted && t()[cur] && !said.has(cur)) { said.add(cur); say(t()[cur]); mood('happy', 'smile', 900); } }
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
  // Облачко не должно заезжать под нижнюю навигацию и плавающую панель темы и языка: упёршись в них, оно останавливается рядом
  const OBSTACLES = ['#dock', '#float-controls'];
  function avoid(x, y) {
    const w = el.offsetWidth, h = el.offsetHeight, m = 10;
    for (const sel of OBSTACLES) {
      const o = document.querySelector(sel); if (!o) continue;
      const r = o.getBoundingClientRect(); if (!r.width) continue;
      if (x + w > r.left - m && x < r.right + m && y + h > r.top - m && y < r.bottom + m) {
        // выходим из зоны по самому короткому пути: вверх, вниз, влево или вправо
        const opts = [[x, r.top - h - m], [x, r.bottom + m], [r.left - w - m, y], [r.right + m, y]]
          .filter(([ox, oy]) => ox >= 8 && oy >= 8 && ox + w <= innerWidth - 8 && oy + h <= innerHeight - 8)
          .sort((a, b) => Math.hypot(a[0] - x, a[1] - y) - Math.hypot(b[0] - x, b[1] - y));
        if (opts.length) [x, y] = opts[0];
      }
    }
    return [x, y];
  }
  // loose = true: пока облачко несут, оно может проходить поверх навигации; зона обходится, когда его отпустили
  const place = (x, y, save, loose) => {
    [x, y] = clamp(x, y);
    if (!loose) [x, y] = avoid(x, y);
    el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.bottom = 'auto'; el.style.right = 'auto';
    // пузырь не должен вылезать за экран: у верхнего края он ниже питомца, слева он идёт влево от тела облачка
    el.classList.toggle('is-top', y < 90); el.classList.toggle('is-right', x + el.offsetWidth / 2 > innerWidth / 2); // облачко в правой половине экрана: реплика слева; в левой половине: реплика справа
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
    place(e.clientX - drag.dx, e.clientY - drag.dy, false, true);
  });
  const endDrag = () => {
    if (!drag) return;
    const moved = drag.moved; drag = null;
    if (!moved) return;
    clearInterval(carry);
    el.classList.remove('is-drag'); mood('happy', 'smile', 1100); hop(); activity(); anchorX = null;
    const r = el.getBoundingClientRect();
    // Отпустили над навигацией: плавно переезжаем в ближайшую свободную точку (вверх или в сторону)
    el.classList.add('is-glide'); setTimeout(() => el.classList.remove('is-glide'), 700);
    place(r.left, r.top, true);
    suppressClick = true; setTimeout(() => { suppressClick = false; }, 0);
    // реплика зависит от места, куда его поставили
    const nearHome = innerWidth - r.right < 120 && innerHeight - r.bottom < 120;
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
    if (!drag && !away && !feeding && !s.sleeping && !walking && !reduce() && !el.classList.contains('is-away')) {
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

  // ---------- пасхалка для тех, кто долистал до конца: звезду внизу страницы можно скормить облачку ----------
  const treat = document.createElement('div');
  treat.className = 'treat';
  treat.innerHTML = '<canvas class="treat__c" width="9" height="9" aria-hidden="true"></canvas><span class="treat__cap"></span>';
  (document.querySelector('#contact .container') || document.body).appendChild(treat);
  treat.classList.add('is-in'); // звезда видна всегда, как только страница долистана до низа
  const tc = treat.querySelector('canvas'), cap = treat.querySelector('.treat__cap');
  const treatText = () => { cap.textContent = t().treatCap; };
  treatText();

  // Крестик убирает облачко со страницы, а вместе с ним и звезду внизу
  el.querySelector('.pet__x').addEventListener('click', (e) => {
    e.stopPropagation();
    el.classList.add('is-gone'); bubble.hidden = true;
    treat.remove();
    setTimeout(() => el.remove(), 400);
  });
  document.addEventListener('langchange', treatText);
  (function paintStar() { // пиксельная звезда 9x9: B контур, Y заливка, W блик
    const g = ['....B....', '...BYB...', '...BYB...', 'BBBBYBBBB', 'BYYYWYYYB', '.BYYYYYB.', '..BYYYB..', '.BYYBYYB.', '.BB...BB.'];
    const col = { B: '#7a4b00', Y: '#ffcf33', W: '#fff4b8' }, c = tc.getContext('2d');
    g.forEach((row, y) => [...row].forEach((ch, x) => { if (col[ch]) { c.fillStyle = col[ch]; c.fillRect(x, y, 1, 1); } }));
  })();

  let treatShown = false, treatGone = false;
  const hearts = () => {
    for (let i = 0; i < 7; i++) {
      const h = document.createElement('i');
      h.className = 'pet__heart'; h.textContent = '♥';
      h.style.setProperty('--x', `${10 + Math.random() * 80}%`); h.style.setProperty('--d', `${Math.random() * 0.4}s`);
      el.appendChild(h); setTimeout(() => h.remove(), 1900);
    }
  };
  function feed() {
    if (feeding || treatGone) return;
    feeding = true; treatGone = true; stopNudges(); anchorX = null;
    treat.classList.remove('is-drag');
    // Звезда летит в облачко из того места, где сейчас находится (даже если её перетащили в другой угол экрана), и уменьшается
    const sr = tc.getBoundingClientRect(), pr = el.getBoundingClientRect();
    const dx = pr.left + pr.width / 2 - (sr.left + sr.width / 2), dy = pr.top + pr.height / 2 - (sr.top + sr.height / 2);
    if (reduce()) treat.classList.add('is-gone');
    else tc.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${dx}px, ${dy}px) scale(.15)`, opacity: 0 }], { duration: 420, easing: 'cubic-bezier(.5, 0, .75, .3)', fill: 'forwards' })
      .onfinish = () => treat.classList.add('is-gone');
    s.eyes = 'open'; s.mouth = 'o'; draw();
    let n = 0;
    const chew = setInterval(() => { s.mouth = n++ % 2 ? 'o' : 'smile'; draw(); }, 150);
    setTimeout(() => {
      clearInterval(chew);
      mood('happy', 'smile', 4200); hop(); setTimeout(hop, 420); hearts();
      el.classList.add('is-fed'); // после угощения у облачка за спиной появляется золотое свечение
      say(t().thanks, true);
      setTimeout(() => say(t().thanks2, true), 3300);
      setTimeout(() => { feeding = false; }, 4200);
    }, 1000);
  }
  const nearPet = (x, y) => { const r = el.getBoundingClientRect(); return x > r.left - 50 && x < r.right + 50 && y > r.top - 50 && y < r.bottom + 50; };
  // Подсказки: сначала облачко просит звезду, через несколько секунд напоминает про перетаскивание, потом само подходит к ней
  let nudge1 = 0, nudge2 = 0;
  const stopNudges = () => { clearTimeout(nudge1); clearTimeout(nudge2); treat.classList.remove('is-hint'); };
  function startNudges() {
    nudge1 = setTimeout(() => {
      if (treatGone || feeding || td) return;
      const r = tc.getBoundingClientRect(), m = el.getBoundingClientRect();
      s.lx = r.left + r.width / 2 < m.left + m.width / 2 ? -1 : 1; s.ly = 0; if (!s.sleeping) draw(); // смотрит на звезду
      say(t().treatNudge, true); treat.classList.add('is-hint');
    }, 6500);
    nudge2 = setTimeout(() => {
      if (treatGone || feeding || td) return;
      // Облачко остаётся на своём месте и только напоминает про звезду (по экрану оно не бегает)
      hop(); say(t().treatBeg, true); mood('happy', 'o', 1200);
    }, 17000);
  }
  // Награда появляется, когда долистали до конца страницы
  addEventListener('scroll', () => {
    if (treatShown || away) return;
    const c = document.getElementById('contact');
    if (c && c.getBoundingClientRect().bottom <= innerHeight + 60) { treatShown = true; treat.classList.add('is-in'); say(t().treatHint, true); mood('happy', 'o', 900); hop(); startNudges(); }
  }, { passive: true });
  // Можно перетащить на облачко или просто нажать: тогда облачко само подбежит
  let td = null;
  treat.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || treatGone || (e.target !== tc && e.target !== cap)) return; // только сама звезда и её подпись
    const r = tc.getBoundingClientRect();
    td = { dx: Math.max(0, Math.min(r.width, e.clientX - r.left)), dy: Math.max(0, Math.min(r.height, e.clientY - r.top)), sx: e.clientX, sy: e.clientY, moved: false, w: r.width, h: r.height };
    stopNudges();
    treat.setPointerCapture(e.pointerId);
    treat.classList.add('is-pressed'); // подпись под звездой пропадает
    // облачко оживает: смотрит на звезду, рот «о», говорит «ням-ням»
    wake(); activity();
    const pr = el.getBoundingClientRect();
    s.lx = r.left + r.width / 2 < pr.left ? -1 : r.left + r.width / 2 > pr.right ? 1 : 0; s.ly = r.top + r.height / 2 > pr.bottom ? 1 : 0;
    mood('happy', 'o'); say(t().nyam, true);
  });
  treat.addEventListener('pointermove', (e) => {
    if (!td) return;
    if (!td.moved) { if (Math.hypot(e.clientX - td.sx, e.clientY - td.sy) < 5) return; td.moved = true; treat.classList.add('is-drag'); wake(); activity(); }
    tc.style.cssText = `position:fixed;z-index:40;left:${e.clientX - td.dx}px;top:${e.clientY - td.dy}px;width:${td.w}px;height:${td.h}px`;
    const r = el.getBoundingClientRect(); s.lx = e.clientX < r.left ? -1 : e.clientX > r.right ? 1 : 0; s.ly = e.clientY > r.bottom ? 1 : 0; draw();
  });
  // Звезда, оставленная на экране, не должна выходить за его границы (в том числе при изменении размера окна)
  function clampStar() {
    if (!treat.classList.contains('is-placed')) return;
    const w = parseFloat(tc.style.width) || 63, h = parseFloat(tc.style.height) || 63;
    tc.style.left = Math.max(8, Math.min(innerWidth - w - 8, parseFloat(tc.style.left) || 0)) + 'px';
    tc.style.top = Math.max(8, Math.min(innerHeight - h - 8, parseFloat(tc.style.top) || 0)) + 'px';
  }
  addEventListener('resize', clampStar);
  const treatUp = (e) => {
    if (!td) return;
    const moved = td.moved; td = null;
    if (!moved) { // клик: звезда сама летит к облачку, оно остаётся на месте
      if (feeding) return;
      wake(); activity(); s.lx = 0; s.ly = 0;
      feed();
      return;
    }
    treat.classList.remove('is-drag');
    if (nearPet(e.clientX, e.clientY)) { feed(); return; }
    // мимо облачка: звезда остаётся висеть в этой точке экрана, пока облачко не покормят
    treat.classList.add('is-placed');
    clampStar();
    s.lx = 0; s.ly = 0; mood('happy', 'smile', 1200); hop();
  };
  treat.addEventListener('pointerup', treatUp);
  treat.addEventListener('pointercancel', treatUp);

  // клик: прыжок и реплика
  let pokes = 0;
  canvas.addEventListener('click', () => {
    if (suppressClick) return;
    wake(); activity(); pokes++; hop();
    if (pokes === 3) { say(t().hint, true); mood('happy', 'smile', 900); return; }
    if (pokes === 5) { say(t().enough, true); mood('happy', 'o', 1100); }
    else if (pokes === 9) { say(t().sulk, true); mood('open', 'flat', 1500); setTimeout(sleep, 1600); }
    else { const p = t().poke; say(p[Math.floor(Math.random() * p.length)], true); mood('happy', 'smile', 900); }
    if (pokes === 4) { say(t().rainSay, true); rain(); } // на четвёртый клик из облачка идёт дождь, три секунды
  });

  // Дождь: капли падают из-под облачка три секунды и прекращаются
  let raining = false;
  function rain() {
    if (raining || reduce()) return;
    raining = true;
    const box = document.createElement('div');
    box.className = 'pet__rain'; box.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 16; i++) {
      const d = document.createElement('i');
      d.style.left = (4 + Math.random() * 92).toFixed(1) + '%';
      d.style.animationDelay = (Math.random() * 0.7).toFixed(2) + 's';
      d.style.animationDuration = (0.55 + Math.random() * 0.35).toFixed(2) + 's';
      box.appendChild(d);
    }
    el.appendChild(box);
    mood('open', 'flat', 3000); // пока идёт дождь, облачко грустит
    setTimeout(() => { box.classList.add('is-off'); setTimeout(() => { box.remove(); raining = false; }, 450); }, 3000);
  }

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
