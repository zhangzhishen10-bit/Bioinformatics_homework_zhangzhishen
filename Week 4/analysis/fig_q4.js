// Q4 figure - variant prioritization workflow + ranked shortlist
const path = require('path');
const fs = require('fs');
const D = require('./lib/draw');
const { PALETTE: P } = D;

const W = 1720, H = 1000;
const { c, ctx } = D.makeCanvas(W, H);

D.title(ctx,
  'Q4  Variant prioritization workflow - from 12 synthetic calls to 1-2 candidates',
  'Filters are declared before coding, applied in order, and every dropped variant gets a written reason. Teaching synthetics: not clinical data.',
  40, 22, 22);

const PANEL_H = 506;

// ================= LEFT: filter cascade =================
const lx = 40, ly = 104, lw = 660;
D.roundRect(ctx, lx, ly, lw, PANEL_H, 12);
ctx.fillStyle = P.panel; ctx.fill();
ctx.strokeStyle = P.rule; ctx.lineWidth = 1.5; ctx.stroke();

ctx.font = 'bold 15px Arial'; ctx.fillStyle = P.purple;
ctx.fillText('STEP 1-5  Hard filters, applied in this order', lx + 18, ly + 14);

const cascade = [
  { step: 'Input',       rule: 'all synthetic calls', n: 12, dropped: 0, note: '' },
  { step: 'FILTER',      rule: 'keep PASS only',      n: 10, dropped: 2, note: 'MSH2 (LowQual), HLA-A (FAIL)' },
  { step: 'DP',          rule: 'DP >= 20x',           n: 9,  dropped: 1, note: 'MECP2 (DP=5)' },
  { step: 'GQ',          rule: 'GQ >= 30',            n: 9,  dropped: 0, note: 'no further loss' },
  { step: 'AF',          rule: 'AF <= 0.01',          n: 6,  dropped: 3, note: 'F5 (0.42), ATM (0.18), intronic (0.35)' },
  { step: 'CONSEQUENCE', rule: 'impactful class',     n: 4,  dropped: 2, note: 'CFTR synonymous, intergenic' },
];

let cy = ly + 46;
const barMaxW = 240;
for (let i = 0; i < cascade.length; i++) {
  const s = cascade[i];
  const isLast = i === cascade.length - 1, isFirst = i === 0;
  ctx.font = 'bold 13px Arial'; ctx.fillStyle = isFirst ? P.sub : P.ink;
  ctx.fillText(s.step, lx + 18, cy + 2);
  ctx.font = '12px Arial'; ctx.fillStyle = P.sub;
  ctx.fillText(s.rule, lx + 18, cy + 19);

  const bx = lx + 178, by = cy + 2, bh = 22;
  const bw = Math.max(10, (s.n / 12) * barMaxW);
  D.roundRect(ctx, bx, by, bw, bh, 4);
  ctx.fillStyle = isLast ? P.green : (isFirst ? P.sub : P.blue);
  ctx.fill();
  ctx.font = 'bold 12.5px Arial'; ctx.fillStyle = P.ink;
  ctx.fillText(String(s.n), bx + bw + 8, cy + 6);
  ctx.font = '11.5px Arial'; ctx.fillStyle = P.red;
  if (s.dropped > 0) ctx.fillText('-' + s.dropped, bx + bw + 34, cy + 7);

  if (s.note) {
    ctx.font = '11px Arial'; ctx.fillStyle = P.sub;
    ctx.fillText(s.note, lx + 178, cy + 30);
  }
  cy += 58;
  if (!isLast) D.arrow(ctx, lx + 34, cy - 24, lx + 34, cy - 8, { color: P.rule, width: 2, head: 7 });
}

const svY = cy + 6;
D.roundRect(ctx, lx + 18, svY, lw - 36, 56, 8);
ctx.fillStyle = P.greenL; ctx.fill();
ctx.strokeStyle = P.green; ctx.lineWidth = 2; ctx.stroke();
ctx.font = 'bold 14.5px Arial'; ctx.fillStyle = P.green;
ctx.fillText('4 variants survive all hard filters', lx + 34, svY + 9);
ctx.font = '12px Arial'; ctx.fillStyle = P.ink;
ctx.fillText('TP53, KRAS, BRCA2, LDLR  -  then ranked by a transparent additive score', lx + 34, svY + 30);

// ================= RIGHT: ranking =================
const rx = 724, rw = 956;
D.roundRect(ctx, rx, ly, rw, PANEL_H, 12);
ctx.fillStyle = P.white; ctx.fill();
ctx.strokeStyle = P.rule; ctx.lineWidth = 1.5; ctx.stroke();

ctx.font = 'bold 15px Arial'; ctx.fillStyle = P.purple;
ctx.fillText('STEP 6  Transparent additive score', rx + 18, ly + 14);
ctx.font = '11.5px Arial'; ctx.fillStyle = P.sub;
ctx.fillText('No black box: every term is inspectable and the weights are stated in the script.', rx + 18, ly + 36);

const rows = [
  { g: 'TP53',  pos: 'chr17:7673803 G>A',  cons: 'splice_acceptor_variant', cv: 'Pathogenic',                  af: '1e-05',  dp: 80, gq: 99, score: 15, parts: [5, 5, 3, 2], top: true },
  { g: 'KRAS',  pos: 'chr12:25398284 C>A', cons: 'missense_variant',        cv: 'Conflicting',                 af: '1.5e-04', dp: 58, gq: 91, score: 9,  parts: [3, 2, 2, 2], top: true },
  { g: 'BRCA2', pos: 'chr13:32316461 C>T', cons: 'missense_variant',        cv: 'Uncertain_significance',      af: '1e-04',  dp: 60, gq: 90, score: 8,  parts: [2, 2, 2, 2], top: false },
  { g: 'LDLR',  pos: 'chr19:11200200 C>T', cons: 'missense_variant',        cv: 'Likely_benign',               af: '2e-04',  dp: 40, gq: 88, score: 6,  parts: [1, 2, 2, 1], top: false },
];

const tblY = ly + 62;
ctx.font = 'bold 11.5px Arial'; ctx.fillStyle = P.sub; ctx.textAlign = 'left';
const cols = [['GENE', 0], ['COORDINATE', 76], ['CONSEQUENCE', 262], ['ClinVar', 452], ['AF', 592], ['DP', 656], ['GQ', 698], ['SCORE', 762]];
for (const [t, dx] of cols) ctx.fillText(t, rx + 18 + dx, tblY);
ctx.font = '10.5px Arial'; ctx.fillStyle = P.sub;
ctx.fillText('bar segments are the four score terms', rx + 18 + 748, tblY + 14);

const segCols = [P.purple, P.orange, P.blue, P.teal];
const segNames = ['ClinVar weight', 'consequence weight', 'rarity (AF)', 'call quality (DP, GQ)'];

let ry = tblY + 20;
for (const r of rows) {
  const rowH = r.top ? 56 : 46;
  if (r.top) {
    D.roundRect(ctx, rx + 10, ry - 5, rw - 20, rowH + 6, 8);
    ctx.fillStyle = P.greenL; ctx.fill();
    ctx.strokeStyle = P.green; ctx.lineWidth = 1.6; ctx.stroke();
  }
  ctx.font = 'bold 14px Arial'; ctx.fillStyle = r.top ? P.green : P.ink;
  ctx.fillText(r.g, rx + 18, ry + 1);
  ctx.font = '11.5px Arial'; ctx.fillStyle = P.ink;
  ctx.fillText(r.pos, rx + 18 + 76, ry + 3);
  ctx.fillStyle = r.cons.startsWith('splice') ? P.purple : P.sub;
  ctx.fillText(r.cons, rx + 18 + 262, ry + 3);
  ctx.font = 'bold 11.5px Arial';
  ctx.fillStyle = r.cv === 'Pathogenic' ? P.red : (r.cv === 'Conflicting' ? P.orange : P.sub);
  ctx.fillText(r.cv, rx + 18 + 452, ry + 3);
  ctx.font = '11.5px Arial'; ctx.fillStyle = P.ink;
  ctx.fillText(r.af, rx + 18 + 592, ry + 3);
  ctx.fillText(String(r.dp), rx + 18 + 656, ry + 3);
  ctx.fillText(String(r.gq), rx + 18 + 698, ry + 3);

  const sbx = rx + 18 + 748, sby = ry + 3, sbh = 16;
  let off = 0;
  for (let k = 0; k < r.parts.length; k++) {
    const segW = r.parts[k] * 4.4;
    ctx.fillStyle = segCols[k];
    ctx.fillRect(sbx + off, sby, segW, sbh);
    off += segW;
  }
  ctx.font = 'bold 12.5px Arial'; ctx.fillStyle = r.top ? P.green : P.ink;
  ctx.fillText('= ' + r.score, sbx + off + 8, sby + 1);
  ry += rowH;
}

// component legend (unambiguous, below the table)
const lgY = ry + 8;
ctx.font = 'bold 11.5px Arial'; ctx.fillStyle = P.sub;
ctx.fillText('Score components:', rx + 18, lgY);
let lgx = rx + 140;
for (let k = 0; k < segCols.length; k++) {
  ctx.fillStyle = segCols[k]; ctx.fillRect(lgx, lgY + 2, 16, 11);
  ctx.font = '11.5px Arial'; ctx.fillStyle = P.sub;
  ctx.fillText(segNames[k], lgx + 22, lgY);
  lgx += 196;
}
ctx.font = '11px Arial'; ctx.fillStyle = P.sub;
ctx.fillText('Weights: ClinVar Pathogenic 5 / Conflicting 3 / VUS 2 / Likely_benign 1;  splice 5 / missense 2;  AF<1e-4 = 3, <1e-3 = 2, else 1;  DP>=50 & GQ>=90 = 2.', rx + 18, lgY + 20);
ctx.font = 'bold 11.5px Arial'; ctx.fillStyle = P.orange;
ctx.fillText('Note the KRAS swap: it ranks 2nd by score, but BRCA2 displaces it under a stricter AF <= 1e-4 filter - so the 2nd pick is not stable.', rx + 18, lgY + 38);

// ================= BOTTOM: false-lead critique =================
const by2 = ly + PANEL_H + 18;
D.roundRect(ctx, 40, by2, 1640, 138, 12);
ctx.fillStyle = P.redL; ctx.fill();
ctx.strokeStyle = P.red; ctx.lineWidth = 2; ctx.stroke();
ctx.font = 'bold 15px Arial'; ctx.fillStyle = P.red;
ctx.fillText('STEP 7  Strongest reasons the top variant could be a FALSE LEAD', 58, by2 + 12);

const leads = [
  ['Synthetic coordinates', 'Positions and ClinVar IDs are invented for teaching - nothing here is a real clinical finding.'],
  ['Predicted, not measured, splicing', '"splice_acceptor_variant" is an annotation. Only RT-PCR / minigene assays show the splice is actually broken.'],
  ['No phenotype link', 'No inheritance model, segregation data or HPO terms, so "Pathogenic" cannot be tied to this patient.'],
  ['Single-call evidence', 'One call at DP=80, no orthogonal confirmation (Sanger) and no check that the other allele is covered.'],
  ['Build ambiguity', 'A chr12:25398284 KRAS coordinate looks GRCh37-style - always name the build before comparing variants.'],
];
let lyy = by2 + 40;
for (const [h, t] of leads) {
  ctx.font = 'bold 12px Arial'; ctx.fillStyle = P.red;
  ctx.fillText('! ' + h, 58, lyy);
  ctx.font = '12px Arial'; ctx.fillStyle = P.ink;
  ctx.fillText(t, 268, lyy);
  lyy += 19;
}

// ================= final statement =================
const fy = by2 + 156;
D.roundRect(ctx, 40, fy, 1640, 64, 12);
ctx.fillStyle = P.purple; ctx.fill();
ctx.font = 'bold 15px Arial'; ctx.fillStyle = P.white; ctx.textAlign = 'center';
ctx.fillText('Variant TP53 chr17:7673803 G>A may influence Gene X / the disease phenotype by affecting canonical splice-acceptor function;', 860, fy + 12);
ctx.fillText('this can be tested by RT-PCR across the exon junction (+ minigene reporter) to show exon skipping, then a functional assay.', 860, fy + 36);
ctx.textAlign = 'left';

ctx.font = '11.5px Arial'; ctx.fillStyle = P.sub;
ctx.fillText('Figure generated for Week 4 Q4. Counts and scores are the actual output of analysis/q4_prioritize.R on data/variants_q4.tsv (synthetic teaching data).', 40, H - 18);

const out = path.join(__dirname, '..', 'figures', 'Q4_prioritization.png');
fs.writeFileSync(out, c.toBuffer('image/png'));
console.log('wrote', out, c.width + 'x' + c.height);
