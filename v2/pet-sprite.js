// Пиксельное облачко: общий рисовальщик для питомца в углу экрана и питомца в чате ассистента.
// Спрайт 20x13 «пикселей», форма из трёх кругов и основания, обводка и тень считаются автоматически.
export const W = 20, H = 13;

const circles = [[5, 7, 4.3], [10, 5.2, 5.2], [15, 7, 4.3]];
const fill = [];
for (let y = 0; y < H; y++) { fill[y] = []; for (let x = 0; x < W; x++) {
  fill[y][x] = circles.some(([cx, cy, r]) => (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) || (x >= 4 && x <= 15 && y >= 7 && y <= 11);
} }
const at = (x, y) => y >= 0 && y < H && x >= 0 && x < W && fill[y][x];
const outline = (x, y) => at(x, y) && !(at(x - 1, y) && at(x + 1, y) && at(x, y - 1) && at(x, y + 1));

const light = { body: '#ffffff', shade: '#dbe6f6', line: '#2a3a5c', eye: '#2a3a5c', blush: '#ffb3c4' };
const dark = { body: '#d4def2', shade: '#9fb1d3', line: '#0e1526', eye: '#0e1526', blush: '#e88ca4' };
export const isDark = () => {
  const t = document.documentElement.getAttribute('data-theme');
  return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
};

function paint(ctx, s) {
  const c = isDark() ? dark : light;
  ctx.clearRect(0, 0, W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!fill[y][x]) continue;
    ctx.fillStyle = outline(x, y) ? c.line : (y >= 10 ? c.shade : c.body);
    ctx.fillRect(x, y, 1, 1);
  }
  const px = (x, y, col) => { ctx.fillStyle = col; ctx.fillRect(x, y, 1, 1); };
  const ey = 8 + s.ly;
  [7 + s.lx, 12 + s.lx].forEach((x) => {
    if (s.eyes === 'open') { px(x, ey, c.eye); px(x, ey + 1, c.eye); }
    else if (s.eyes === 'blink') { px(x, ey + 1, c.eye); }
    else if (s.eyes === 'happy') { px(x - 1, ey + 1, c.eye); px(x, ey, c.eye); px(x + 1, ey + 1, c.eye); }
    else { px(x - 1, ey + 1, c.eye); px(x, ey + 1, c.eye); px(x + 1, ey + 1, c.eye); } // sleep
  });
  if (s.mouth === 'smile') { px(8, 9, c.eye); px(11, 9, c.eye); px(9, 10, c.eye); px(10, 10, c.eye); }
  else if (s.mouth === 'o') { px(9, 9, c.eye); px(10, 9, c.eye); px(9, 10, c.eye); px(10, 10, c.eye); }
  else { px(9, 10, c.eye); px(10, 10, c.eye); }
  if (s.eyes !== 'sleep') { px(5, 9, c.blush); px(14, 9, c.blush); }
}

// Все созданные спрайты перерисовываются при смене темы
const all = new Set();
const redrawAll = () => all.forEach((sp) => { if (sp.canvas.isConnected) sp.draw(); else all.delete(sp); });
new MutationObserver(redrawAll).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', redrawAll);

export function createSprite(canvas) {
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const sp = { canvas, s: { eyes: 'open', mouth: 'smile', lx: 0, ly: 0 }, draw() { paint(ctx, sp.s); } };
  all.add(sp);
  sp.draw();
  return sp;
}
