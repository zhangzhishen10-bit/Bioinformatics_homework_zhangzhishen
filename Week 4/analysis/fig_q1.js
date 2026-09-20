// Q1 figure - Choose the right genomic assay (workflow figure)
const path = require('path');
const fs = require('fs');
const D = require('./lib/draw');
const { PALETTE: P } = D;

const W = 1600, H = 1120;
const { c, ctx } = D.makeCanvas(W, H);

D.title(ctx,
  'Q1  Which mechanism drives Gene X upregulation? — an assay strategy',
  'Observation first, then perturbation. Each assay constrains a different hypothesis; none proves causality alone.',
  40, 24, 23);

// ---------- Row A: the question + the five candidate mechanisms ----------
const rowAY = 104, rowAH = 92;
D.box(ctx, 40, rowAY, 1520, rowAH, '', { fill: P.purpleL, stroke: P.purple, radius: 12, strokeWidth: 2 });
ctx.font = 'bold 15px Arial'; ctx.fillStyle = P.purple; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
ctx.fillText('BIOLOGICAL QUESTION', 58, rowAY + 10);
ctx.font = '15px Arial'; ctx.fillStyle = P.ink;
ctx.fillText('Gene X mRNA is significantly upregulated in disease vs healthy controls. Which mechanism explains it?', 58, rowAY + 32);

const mechs = ['Regulatory variant', 'Chromatin accessibility', 'TF binding / histone mark', 'DNA methylation', 'Enhancer–promoter contact'];
let mx = 58, myy = rowAY + 58;
const mcolors = [P.blue, P.teal, P.orange, P.purple, P.green];
for (let i = 0; i < mechs.length; i++) {
  const r = D.pill(ctx, mx, myy, mechs[i], { fill: P.white, stroke: mcolors[i], textColor: mcolors[i], fontSize: 12.5 });
  mx += r.w + 12;
}
ctx.textAlign = 'left';

// ---------- Row B: five observational assays ----------
const rowBY = 232, boxW = 284, boxH = 186, gap = 20;
const assays = [
  { t: '1 · ATAC-seq', m: 'Measures: open chromatin\n(Tn5 insertion)', f: 'Tests: is this region\naccessible at all?', limit: 'Cannot prove the element\nregulates Gene X', col: P.teal, fill: P.tealL },
  { t: '2 · H3K27ac CUT&Tag', m: 'Measures: active-enhancer\nhistone mark', f: 'Tests: does it look like an\nactive enhancer?', limit: 'Cannot prove target gene\nor direction of effect', col: P.orange, fill: P.orangeL },
  { t: '3 · WGBS / EM-seq', m: 'Measures: 5mC per CpG\n(methylation fraction)', f: 'Tests: is the element\nsilenced by methylation?', limit: 'Bulk fraction mixes alleles,\ncells and molecules', col: P.purple, fill: P.purpleL },
  { t: '4 · Hi-C / Micro-C', m: 'Measures: 3D contact\nfrequency (loops)', f: 'Tests: does it physically\ntouch the Gene X promoter?', limit: 'A loop prioritizes a link;\nit does not prove control', col: P.green, fill: P.greenL },
  { t: '5 · RNA-seq (have it)', m: 'Measures: mature transcript\nabundance', f: 'Tests: is Gene X really up\nand by how much?', limit: 'Correlation only — tells you\nnothing about mechanism', col: P.blue, fill: P.blueL },
];
for (let i = 0; i < assays.length; i++) {
  const a = assays[i];
  const x = 40 + i * (boxW + gap);
  D.roundRect(ctx, x, rowBY, boxW, boxH, 10);
  ctx.fillStyle = a.fill; ctx.fill();
  ctx.strokeStyle = a.col; ctx.lineWidth = 2; ctx.stroke();

  ctx.font = 'bold 15px Arial'; ctx.fillStyle = a.col; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText(a.t, x + boxW / 2, rowBY + 12);

  ctx.font = '13px Arial'; ctx.fillStyle = P.ink; ctx.textAlign = 'left';
  let ty = rowBY + 40;
  for (const ln of a.m.split('\n')) { ctx.fillText(ln, x + 14, ty); ty += 17; }

  ctx.fillStyle = P.sub;
  ty += 3;
  ctx.font = 'italic 12.5px Arial';
  for (const ln of a.f.split('\n')) { ctx.fillText(ln, x + 14, ty); ty += 16; }

  ctx.fillStyle = P.red; ctx.font = '12.5px Arial';
  ty += 3;
  for (const ln of a.limit.split('\n')) { ctx.fillText(ln, x + 14, ty); ty += 16; }
}
ctx.textAlign = 'left';

// ---------- Integration bar ----------
const intY = 442, intH = 62;
ctx.save();
D.roundRect(ctx, 40, intY, 1520, intH, 10);
ctx.fillStyle = P.ink; ctx.fill();
ctx.restore();
ctx.font = 'bold 16px Arial'; ctx.fillStyle = P.white; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
ctx.fillText('INTEGRATION   —   the five layers only become a mechanism when read together', 800, intY + 12);
ctx.font = '13px Arial'; ctx.fillStyle = '#D9D9EA';
ctx.fillText('Open chromatin + H3K27ac + low methylation + a promoter contact in the SAME cells  ⇒  plausible enhancer of Gene X', 800, intY + 36);
ctx.textAlign = 'left';

// ---------- Decision band ----------
const decY = 526, decH = 96;
D.box(ctx, 40, decY, 1520, decH, '', { fill: P.panel, stroke: P.rule, radius: 10 });
ctx.font = 'bold 13px Arial'; ctx.fillStyle = P.purple; ctx.textAlign = 'left';
ctx.fillText('DECISION RULE  —  what result sends you down which branch', 58, decY + 12);
const rules = [
  ['Variant found in the accessible element', '→ MPRA to test sequence capacity'],
  ['Element is accessible but no contact with promoter', '→ Hi-C / Micro-C, then loop-anchor perturbation'],
  ['Element is methylated and Gene X low', '→ EM-seq + demethylation (dCas9-TET1) rescue'],
  ['Nothing found in cis', '→ look trans: TF abundance, copy number, or 3D rewiring'],
];
let ry = decY + 36;
for (const [a, b] of rules) {
  ctx.font = '13px Arial'; ctx.fillStyle = P.ink;
  ctx.fillText('• ' + a, 62, ry);
  ctx.font = 'bold 13px Arial'; ctx.fillStyle = P.blue;
  ctx.fillText(b, 640, ry);
  ry += 15;
}
ctx.textAlign = 'left';

// ---------- Row C: two validation arms ----------
const rowCY = 652, valW = 745, valH = 250;
function validationBox(x, colour, fill, num, title, subtitle, proves, cant, detail) {
  D.roundRect(ctx, x, rowCY, valW, valH, 12);
  ctx.fillStyle = fill; ctx.fill();
  ctx.strokeStyle = colour; ctx.lineWidth = 2.5; ctx.stroke();

  ctx.font = 'bold 17px Arial'; ctx.fillStyle = colour;
  ctx.fillText(num + '  ' + title, x + 18, rowCY + 14);
  ctx.font = '12.5px Arial'; ctx.fillStyle = P.sub;
  ctx.fillText(subtitle, x + 18, rowCY + 38);

  ctx.font = 'bold 13px Arial'; ctx.fillStyle = P.green;
  ctx.fillText('PROVES', x + 18, rowCY + 64);
  ctx.font = '13px Arial'; ctx.fillStyle = P.ink;
  let ty = rowCY + 82;
  for (const ln of proves) { ctx.fillText(ln, x + 18, ty); ty += 17; }

  ctx.font = 'bold 13px Arial'; ctx.fillStyle = P.red;
  ctx.fillText('STILL CANNOT PROVE', x + 18, ty + 8);
  ctx.font = '13px Arial'; ctx.fillStyle = P.ink;
  ty += 26;
  for (const ln of cant) { ctx.fillText(ln, x + 18, ty); ty += 17; }

  ctx.font = '12px Arial'; ctx.fillStyle = P.sub;
  ctx.fillText(detail, x + 18, rowCY + valH - 22);
}

validationBox(40, P.blue, P.blueL, 'A',
  'Sequence-capacity test (MPRA / STARR-seq)',
  'The element is cloned out of its locus and put in front of a reporter.',
  ['The sequence itself drives transcription',
   'Effect of the variant allele vs reference allele',
   'Barcoded replicates → activity + uncertainty'],
  ['Whether the element controls Gene X in its native locus',
   'Chromatin context, 3D position, or TF availability'],
  'Readout: normalized RNA / library DNA. Biological samples define replication.');

validationBox(815, P.green, P.greenL, 'B',
  'Endogenous perturbation (CRISPRi / enhancer deletion)',
  'The element stays exactly where it is; you break it or silence it.',
  ['The element is necessary for Gene X expression',
   'Direction of the effect in the real chromatin environment',
   'Target-gene specificity via the right controls'],
  ['Whether the element is sufficient on its own',
   'That the same mechanism runs in every cell type'],
  'Readout: target-gene RNA after CRISPRi (dCas9-KRAB) or enhancer deletion.');

// arrows validation -> final statement
D.arrow(ctx, 412, rowCY - 8, 412, rowCY + 2, { color: P.blue, width: 2.5, head: 0 });
D.arrow(ctx, 1187, rowCY - 8, 1187, rowCY + 2, { color: P.green, width: 2.5, head: 0 });

// ---------- Final statement ----------
const finY = 928, finH = 84;
D.roundRect(ctx, 40, finY, 1520, finH, 12);
ctx.fillStyle = P.purple; ctx.fill();
ctx.font = 'bold 17px Arial'; ctx.fillStyle = P.white; ctx.textAlign = 'center';
ctx.fillText('The biological question chooses the assay because…', 800, finY + 14);
ctx.font = '13.5px Arial'; ctx.fillStyle = '#EDE7FB';
ctx.fillText('…the question is about a mechanism, not a molecule. ATAC-seq, H3K27ac, EM-seq and Hi-C each remove one candidate mechanism', 800, finY + 42);
ctx.fillText('(observation), and only MPRA plus endogenous perturbation convert the remaining correlation into causal evidence.', 800, finY + 62);
ctx.textAlign = 'left';

ctx.font = '11.5px Arial'; ctx.fillStyle = P.sub;
ctx.fillText('Figure generated for Week 4 Q1. Assay logic follows the Week 4 lecture (observation ≠ function; reporter tests capacity, perturbation tests native function).', 40, H - 30);

const out = path.join(__dirname, '..', 'figures', 'Q1_workflow.png');
fs.writeFileSync(out, c.toBuffer('image/png'));
console.log('wrote', out, c.width + 'x' + c.height);
