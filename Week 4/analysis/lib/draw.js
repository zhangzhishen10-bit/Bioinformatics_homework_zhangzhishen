// Shared drawing helpers for Week 4 homework figures (@napi-rs/canvas)
const { createCanvas } = require('@napi-rs/canvas');

const PALETTE = {
  ink:      '#1a1a2e',
  sub:      '#555577',
  white:    '#ffffff',
  panel:    '#f7f7fb',
  rule:     '#d8d8e6',
  purple:   '#6C4AB6',
  purpleL:  '#EDE7FB',
  blue:     '#1B6CA8',
  blueL:   '#E4F0F9',
  green:    '#2E8B57',
  greenL:  '#E6F4EC',
  orange:   '#E07B39',
  orangeL: '#FDF0E4',
  red:      '#D7263D',
  redL:     '#FCE8EB',
  yellow:   '#F2C14E',
  teal:     '#2A9D8F',
  tealL:    '#E3F4F1',
  greyL:    '#EFEFF4',
};

function hexToRgba(hex, a) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

function makeCanvas(w, h, bg = PALETTE.white) {
  const c = createCanvas(w, h);
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.textBaseline = 'top';
  return { c, ctx };
}

function roundRect(ctx, x, y, w, h, r = 8) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** word-wrap text into lines that fit maxW */
function wrap(ctx, text, maxW) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (ctx.measureText(t).width <= maxW || !cur) cur = t;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

/** Draw a labelled box. opts: {fill, stroke, textColor, fontSize, bold, align, radius, pad, subtitle, subtitleSize, dash} */
function box(ctx, x, y, w, h, title, opts = {}) {
  const o = Object.assign({
    fill: PALETTE.white, stroke: PALETTE.rule, textColor: PALETTE.ink,
    fontSize: 15, bold: true, align: 'center', radius: 8, pad: 8,
    subtitle: null, subtitleSize: 12, subtitleColor: PALETTE.sub,
    strokeWidth: 1.5, dash: null,
  }, opts);
  ctx.save();
  if (o.dash) ctx.setLineDash(o.dash);
  roundRect(ctx, x, y, w, h, o.radius);
  ctx.fillStyle = o.fill; ctx.fill();
  if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = o.strokeWidth; ctx.stroke(); }
  ctx.restore();

  ctx.font = `${o.bold ? 'bold ' : ''}${o.fontSize}px Arial`;
  ctx.fillStyle = o.textColor;
  ctx.textAlign = o.align;
  const cx = o.align === 'center' ? x + w / 2 : (o.align === 'right' ? x + w - o.pad : x + o.pad);
  const availW = w - 2 * o.pad;
  const tLines = wrap(ctx, title, availW);
  const sLines = o.subtitle ? (() => {
    ctx.font = `${o.subtitleSize}px Arial`;
    const r = wrap(ctx, o.subtitle, availW);
    ctx.font = `${o.bold ? 'bold ' : ''}${o.fontSize}px Arial`;
    return r;
  })() : [];

  const lh = o.fontSize * 1.25;
  const slh = o.subtitleSize * 1.3;
  const totalH = tLines.length * lh + (sLines.length ? 4 + sLines.length * slh : 0);
  let ty = y + (h - totalH) / 2;
  ctx.textBaseline = 'top';
  for (const ln of tLines) { ctx.fillText(ln, cx, ty); ty += lh; }
  if (sLines.length) {
    ty += 2;
    ctx.font = `${o.subtitleSize}px Arial`;
    ctx.fillStyle = o.subtitleColor;
    for (const ln of sLines) { ctx.fillText(ln, cx, ty); ty += slh; }
  }
  ctx.textAlign = 'left';
}

/** Straight arrow with head. */
function arrow(ctx, x1, y1, x2, y2, opts = {}) {
  const o = Object.assign({ color: PALETTE.sub, width: 2, head: 9, dash: null }, opts);
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.save();
  if (o.dash) ctx.setLineDash(o.dash);
  ctx.strokeStyle = o.color; ctx.fillStyle = o.color; ctx.lineWidth = o.width;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - o.head * Math.cos(ang - 0.4), y2 - o.head * Math.sin(ang - 0.4));
  ctx.lineTo(x2 - o.head * Math.cos(ang + 0.4), y2 - o.head * Math.sin(ang + 0.4));
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

/** Elbow (orthogonal) arrow: horizontal then vertical. 'hv' | 'vh' */
function elbowArrow(ctx, x1, y1, x2, y2, opts = {}) {
  const o = Object.assign({ color: PALETTE.sub, width: 2, head: 9, mode: 'hv' }, opts);
  if (o.mode === 'hv') {
    arrow(ctx, x1, y1, x2, y1, { ...o, head: 0 });
    arrow(ctx, x2, y1, x2, y2, o);
  } else {
    arrow(ctx, x1, y1, x1, y2, { ...o, head: 0 });
    arrow(ctx, x1, y2, x2, y2, o);
  }
}

/** Small pill/label */
function pill(ctx, x, y, text, opts = {}) {
  const o = Object.assign({
    fill: PALETTE.greyL, textColor: PALETTE.ink, fontSize: 12,
    padX: 10, padY: 5, bold: true, stroke: null, radius: 20,
  }, opts);
  ctx.font = `${o.bold ? 'bold ' : ''}${o.fontSize}px Arial`;
  const w = ctx.measureText(text).width + 2 * o.padX;
  const h = o.fontSize + 2 * o.padY;
  roundRect(ctx, x, y, w, h, o.radius);
  ctx.fillStyle = o.fill; ctx.fill();
  if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = 1.2; ctx.stroke(); }
  ctx.fillStyle = o.textColor; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText(text, x + o.padX, y + o.padY);
  return { w, h };
}

function title(ctx, text, sub, x = 40, y = 26, size = 25) {
  ctx.fillStyle = PALETTE.ink; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.font = `bold ${size}px Arial`;
  ctx.fillText(text, x, y);
  if (sub) {
    ctx.font = '14px Arial'; ctx.fillStyle = PALETTE.sub;
    ctx.fillText(sub, x, y + size + 8);
  }
}

function footer(ctx, text, w, h) {
  ctx.font = '11.5px Arial'; ctx.fillStyle = PALETTE.sub;
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText(text, 40, h - 26);
  ctx.strokeStyle = PALETTE.rule; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(40, h - 34); ctx.lineTo(w - 40, h - 34); ctx.stroke();
}

module.exports = {
  PALETTE, hexToRgba, makeCanvas, roundRect, wrap,
  box, arrow, elbowArrow, pill, title, footer,
};
