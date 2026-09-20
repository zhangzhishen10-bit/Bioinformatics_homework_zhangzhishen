// Q3 figure - integrated locus view: accessibility -> chromatin -> methylation -> 3D -> expression -> perturbation
const path = require('path');
const fs = require('fs');
const D = require('./lib/draw');
const { PALETTE: P } = D;

const W = 1720, H = 1040;
const { c, ctx } = D.makeCanvas(W, H);

D.title(ctx,
  'Q3  Is the candidate upstream region a plausible enhancer of Gene Y?',
  'Same biological condition, five layers, one locus. Each track is a direct observation - the mechanism is the interpretation built on top.',
  40, 22, 22);

const plotX = 190, plotW = 1180;
const enhCenter = plotX + 0.30 * plotW;
const tss       = plotX + 0.62 * plotW;
const geneEnd   = plotX + 0.95 * plotW;

function laneLabel(y, h, name, sub, col) {
  D.roundRect(ctx, 40, y, 138, h, 8);
  ctx.fillStyle = D.hexToRgba(col, 0.14); ctx.fill();
  ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.font = 'bold 12.5px Arial'; ctx.fillStyle = col;
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  const tl = D.wrap(ctx, name, 122);
  let ty = y + (h - tl.length * 15 - 14) / 2;
  for (const ln of tl) { ctx.fillText(ln, 48, ty); ty += 15; }
  if (sub) { ctx.font = '10.5px Arial'; ctx.fillStyle = P.sub; ctx.fillText(sub, 48, ty + 1); }
}

function prng(seed) { let s = seed; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; }
function gaussian(x, mu, sd) { return Math.exp(-0.5 * ((x - mu) / sd) ** 2); }

// ===== Lane 1: ATAC-seq =====
let y = 106; const laneH = 72;
laneLabel(y, laneH, 'ATAC-seq', 'accessibility', P.teal);
ctx.strokeStyle = P.rule; ctx.lineWidth = 1;
ctx.beginPath(); ctx.moveTo(plotX, y + laneH - 12); ctx.lineTo(plotX + plotW, y + laneH - 12); ctx.stroke();
{
  const rnd = prng(7);
  ctx.beginPath(); ctx.moveTo(plotX, y + laneH - 12);
  for (let i = 0; i <= plotW; i += 2) {
    const x = plotX + i;
    let v = 0.10 + 0.16 * rnd();
    v += 0.78 * gaussian(x, enhCenter, 26);
    v += 0.92 * gaussian(x, tss, 20);
    v += 0.22 * gaussian(x, tss + 210, 34);
    ctx.lineTo(x, y + laneH - 12 - v * (laneH - 22));
  }
  ctx.lineTo(plotX + plotW, y + laneH - 12);
  ctx.closePath();
  ctx.fillStyle = D.hexToRgba(P.teal, 0.72); ctx.fill();
  ctx.strokeStyle = P.teal; ctx.lineWidth = 1.4; ctx.stroke();
}
ctx.font = '10.5px Arial'; ctx.fillStyle = P.sub; ctx.textAlign = 'left';
ctx.fillText('peak over the candidate element', enhCenter + 62, y + 5);
ctx.fillText('TSS peak', tss + 44, y + 5);

// ===== Lane 2: H3K27ac =====
y += laneH + 12;
laneLabel(y, laneH, 'H3K27ac CUT&Tag', 'active enhancer mark', P.orange);
ctx.strokeStyle = P.rule; ctx.beginPath(); ctx.moveTo(plotX, y + laneH - 12); ctx.lineTo(plotX + plotW, y + laneH - 12); ctx.stroke();
{
  const rnd = prng(23);
  ctx.beginPath(); ctx.moveTo(plotX, y + laneH - 12);
  for (let i = 0; i <= plotW; i += 2) {
    const x = plotX + i;
    let v = 0.07 + 0.10 * rnd();
    v += 0.62 * gaussian(x, enhCenter + 8, 46);
    v += 0.80 * gaussian(x, tss, 40);
    ctx.lineTo(x, y + laneH - 12 - v * (laneH - 22));
  }
  ctx.lineTo(plotX + plotW, y + laneH - 12);
  ctx.closePath();
  ctx.fillStyle = D.hexToRgba(P.orange, 0.72); ctx.fill();
  ctx.strokeStyle = P.orange; ctx.lineWidth = 1.4; ctx.stroke();
}
ctx.font = '10.5px Arial'; ctx.fillStyle = P.sub;
ctx.fillText('broad H3K27ac domain over the candidate region', enhCenter - 122, y + 5);

// ===== Lane 3: methylation =====
y += laneH + 12;
laneLabel(y, laneH, 'DNA methylation', 'WGBS / EM-seq, 5mC', P.purple);
ctx.strokeStyle = P.rule; ctx.beginPath(); ctx.moveTo(plotX, y + laneH - 12); ctx.lineTo(plotX + plotW, y + laneH - 12); ctx.stroke();
{
  const rnd = prng(41);
  for (let i = 6; i <= plotW - 6; i += 15) {
    const x = plotX + i;
    const inEnh = Math.abs(x - enhCenter) < 62;
    const inProm = Math.abs(x - tss) < 45;
    const p = inEnh ? 0.10 + 0.14 * rnd() : (inProm ? 0.15 + 0.18 * rnd() : 0.62 + 0.30 * rnd());
    const h = 6 + p * (laneH - 30);
    ctx.beginPath();
    ctx.moveTo(x, y + laneH - 12); ctx.lineTo(x, y + laneH - 12 - h);
    ctx.strokeStyle = p < 0.35 ? P.purple : D.hexToRgba(P.purple, 0.42);
    ctx.lineWidth = p < 0.35 ? 2.4 : 1.8; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y + laneH - 12 - h, p < 0.35 ? 3.1 : 2.5, 0, Math.PI * 2);
    ctx.fillStyle = p < 0.35 ? P.purple : D.hexToRgba(P.purple, 0.42); ctx.fill();
  }
}
ctx.font = '10.5px Arial'; ctx.fillStyle = P.purple;
ctx.fillText('hypomethylated CpGs across the candidate element', enhCenter - 118, y + 5);
ctx.fillStyle = P.sub;
ctx.fillText('densely methylated', plotX + plotW - 200, y + 5);

// ===== Lane 4: Hi-C =====
y += laneH + 8;
laneLabel(y, laneH, 'Hi-C / Micro-C', '3D contact', P.green);
ctx.strokeStyle = P.rule; ctx.beginPath(); ctx.moveTo(plotX, y + laneH - 10); ctx.lineTo(plotX + plotW, y + laneH - 10); ctx.stroke();
function arc(x1, x2, height, col, width, alpha) {
  const midX = (x1 + x2) / 2, baseY = y + laneH - 10;
  ctx.beginPath();
  ctx.moveTo(x1, baseY);
  ctx.quadraticCurveTo(midX, baseY - height, x2, baseY);
  ctx.strokeStyle = D.hexToRgba(col, alpha); ctx.lineWidth = width; ctx.stroke();
}
arc(enhCenter, tss, 50, P.green, 2.8, 0.95);
arc(enhCenter, tss + 240, 38, P.green, 2.0, 0.45);
arc(tss, tss + 300, 34, P.green, 2.0, 0.35);
ctx.font = '10.5px Arial'; ctx.fillStyle = P.green;
ctx.fillText('enhancer-promoter loop', (enhCenter + tss) / 2 - 62, y + 4);

// ===== Lane 5: RNA-seq =====
y += laneH + 12;
laneLabel(y, laneH, 'RNA-seq', 'expression', P.blue);
ctx.strokeStyle = P.rule; ctx.beginPath(); ctx.moveTo(plotX, y + laneH - 12); ctx.lineTo(plotX + plotW, y + laneH - 12); ctx.stroke();
{
  const rnd = prng(97);
  ctx.beginPath(); ctx.moveTo(plotX, y + laneH - 12);
  for (let i = 0; i <= plotW; i += 2) {
    const x = plotX + i;
    let v = 0.05 + 0.08 * rnd();
    if (x > tss + 30 && x < geneEnd) v += 0.70 + 0.22 * rnd();
    v += 0.30 * gaussian(x, tss, 26);
    ctx.lineTo(x, y + laneH - 12 - v * (laneH - 22));
  }
  ctx.lineTo(plotX + plotW, y + laneH - 12);
  ctx.closePath();
  ctx.fillStyle = D.hexToRgba(P.blue, 0.68); ctx.fill();
  ctx.strokeStyle = P.blue; ctx.lineWidth = 1.4; ctx.stroke();
}
ctx.font = '10.5px Arial'; ctx.fillStyle = P.blue;
ctx.fillText('Gene Y transcribed', (tss + geneEnd) / 2 - 46, y + 5);

// ===== gene model =====
const gmY = y + laneH - 2;
ctx.strokeStyle = P.ink; ctx.lineWidth = 2;
ctx.beginPath(); ctx.moveTo(plotX, gmY + 22); ctx.lineTo(plotX + plotW, gmY + 22); ctx.stroke();

ctx.setLineDash([5, 4]); ctx.strokeStyle = P.red; ctx.lineWidth = 2;
ctx.strokeRect(enhCenter - 62, gmY + 8, 124, 28);
ctx.setLineDash([]);
ctx.font = 'bold 11.5px Arial'; ctx.fillStyle = P.red;
ctx.fillText('candidate region', enhCenter - 56, gmY + 42);

ctx.fillStyle = P.orange;
D.roundRect(ctx, enhCenter - 18, gmY + 15, 36, 14, 3); ctx.fill();
ctx.font = 'bold 11px Arial'; ctx.fillStyle = P.orange;
ctx.fillText('enhancer?', enhCenter - 30, gmY - 13);

ctx.strokeStyle = P.ink; ctx.lineWidth = 2;
ctx.beginPath(); ctx.moveTo(tss, gmY + 22); ctx.lineTo(tss, gmY + 4); ctx.stroke();
D.arrow(ctx, tss, gmY + 16, tss + 16, gmY + 16, { color: P.ink, width: 2, head: 7 });
ctx.font = 'bold 11px Arial'; ctx.fillStyle = P.ink; ctx.fillText('TSS', tss - 9, gmY + 40);

ctx.fillStyle = P.blue;
const exons = [[0.62, 0.07], [0.72, 0.05], [0.80, 0.08], [0.90, 0.05]];
for (const [f, wfrac] of exons) {
  const ex = plotX + f * plotW, ew = wfrac * plotW;
  D.roundRect(ctx, ex, gmY + 13, ew, 18, 3); ctx.fill();
}
ctx.font = 'bold 12px Arial'; ctx.fillStyle = P.blue;
ctx.fillText('Gene Y', plotX + 0.80 * plotW + 20, gmY + 14);
ctx.font = '11px Arial'; ctx.fillStyle = P.sub;
ctx.fillText('genomic position  ->', plotX + plotW - 118, gmY + 46);

// ===== second panel =====
const p2Y = gmY + 76;
D.roundRect(ctx, 40, p2Y, 1640, 178, 12);
ctx.fillStyle = P.panel; ctx.fill();
ctx.strokeStyle = P.rule; ctx.lineWidth = 1.5; ctx.stroke();

ctx.font = 'bold 14px Arial'; ctx.fillStyle = P.purple;
ctx.fillText('FROM CORRELATION TO CAUSATION - the chain the evidence supports', 58, p2Y + 12);

const chain = [
  { t: 'Accessibility', d: 'ATAC peak', col: P.teal, ev: 'observed' },
  { t: 'Chromatin state', d: 'H3K27ac domain', col: P.orange, ev: 'observed' },
  { t: 'Methylation', d: 'hypomethylated CpGs', col: P.purple, ev: 'observed' },
  { t: '3D contact', d: 'loop to promoter', col: P.green, ev: 'observed' },
  { t: 'Expression', d: 'Gene Y transcribed', col: P.blue, ev: 'observed' },
  { t: 'Perturbation', d: 'CRISPRi / deletion', col: P.red, ev: 'NOT measured' },
];
const cw = 242, cgap = 20;
for (let i = 0; i < chain.length; i++) {
  const bx = 58 + i * (cw + cgap), by = p2Y + 38, bh = 74;
  const isLast = i === chain.length - 1;
  D.roundRect(ctx, bx, by, cw, bh, 9);
  ctx.fillStyle = isLast ? P.redL : P.white; ctx.fill();
  ctx.strokeStyle = chain[i].col; ctx.lineWidth = 2;
  if (isLast) ctx.setLineDash([6, 4]);
  ctx.stroke(); ctx.setLineDash([]);
  ctx.font = 'bold 13px Arial'; ctx.fillStyle = chain[i].col; ctx.textAlign = 'center';
  ctx.fillText(chain[i].t, bx + cw / 2, by + 12);
  ctx.font = '11.5px Arial'; ctx.fillStyle = P.ink;
  ctx.fillText(chain[i].d, bx + cw / 2, by + 32);
  ctx.font = 'bold 10.5px Arial'; ctx.fillStyle = isLast ? P.red : P.green;
  ctx.fillText(chain[i].ev, bx + cw / 2, by + 52);
  ctx.textAlign = 'left';
  if (i < chain.length - 1) D.arrow(ctx, bx + cw + 3, by + bh / 2, bx + cw + cgap - 3, by + bh / 2, { color: P.ink, width: 2.2, head: 8 });
}
ctx.font = '12px Arial'; ctx.fillStyle = P.sub;
ctx.fillText('The first five links are correlations that agree with each other. Only a perturbation of the native locus tests whether the element actually controls Gene Y.', 58, p2Y + 124);
ctx.font = 'bold 11.5px Arial'; ctx.fillStyle = P.red;
ctx.fillText('Also still missing: allele-specific methylation / accessibility (bulk averages hide them), the identity of the TF at the element, and whether the loop exists in the disease-relevant cell type.', 58, p2Y + 148);

// ===== final hypothesis band =====
const hyY = p2Y + 196;
D.roundRect(ctx, 40, hyY, 1640, 72, 12);
ctx.fillStyle = P.purple; ctx.fill();
ctx.font = 'bold 16px Arial'; ctx.fillStyle = P.white; ctx.textAlign = 'center';
ctx.fillText('The candidate element regulates Gene Y by', 820, hyY + 12);
ctx.font = '14px Arial'; ctx.fillStyle = '#EDE7FB';
ctx.fillText('acting as a cell-type-specific enhancer that loops to the Gene Y promoter and sustains its transcription', 820, hyY + 36);
ctx.font = 'bold 13.5px Arial'; ctx.fillStyle = P.white;
ctx.fillText('- and this can be tested by CRISPRi / enhancer deletion at the native locus, with an MPRA as the sequence-capacity control.', 820, hyY + 52);
ctx.textAlign = 'left';

ctx.font = '11.5px Arial'; ctx.fillStyle = P.sub;
ctx.fillText('Figure generated for Week 4 Q3. Tracks are schematic illustrations of the expected signatures, not measured data. Chain logic follows the Week 4 lecture: omics nominate regions; perturbation tests function.', 40, H - 20);

const out = path.join(__dirname, '..', 'figures', 'Q3_locus_chain.png');
fs.writeFileSync(out, c.toBuffer('image/png'));
console.log('wrote', out, c.width + 'x' + c.height);

