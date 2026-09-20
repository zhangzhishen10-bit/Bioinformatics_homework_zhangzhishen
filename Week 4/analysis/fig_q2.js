// Q2 figure - FASTQ to interpretable genomic results (workflow diagram)
const path = require('path');
const fs = require('fs');
const D = require('./lib/draw');
const { PALETTE: P } = D;

const W = 1720, H = 1105;
const { c, ctx } = D.makeCanvas(W, H);

D.title(ctx,
  'Q2  From FASTQ to interpretable genomic results — complete analysis workflow',
  'Assumed assay: germline WGS for variant discovery. The same skeleton serves RNA-seq / ATAC-seq / ChIP-seq by swapping stage 5. Versions are the ones I verified.',
  40, 22, 22);

// ---------------- top pipeline banner (the 5 shared principles) -------------
const bandY = 96;
D.roundRect(ctx, 40, bandY, 1640, 52, 10);
ctx.fillStyle = P.ink; ctx.fill();
const stages5 = ['Raw data\nFASTQ', 'Quality control\nFastQC / MultiQC', 'Alignment\nBWA-MEM2', 'Assay-specific analysis\nvariant calling', 'Biological\ninterpretation'];
for (let i = 0; i < 5; i++) {
  const x = 60 + i * 326;
  ctx.font = 'bold 12.5px Arial'; ctx.fillStyle = P.white; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  const lines = stages5[i].split('\n');
  ctx.fillText(lines[0], x + 140, bandY + 9);
  ctx.font = '11px Arial'; ctx.fillStyle = '#B9B9D0';
  ctx.fillText(lines[1], x + 140, bandY + 27);
  if (i < 4) D.arrow(ctx, x + 288, bandY + 26, x + 320, bandY + 26, { color: P.yellow, width: 2.5, head: 8 });
}
ctx.textAlign = 'left';

// ---------------- the 8 documented stages -------------
const stages = [
  { n: '1', t: 'FASTQ quality control', tool: 'FastQC 0.12.1  +  MultiQC', why: 'Detect adapter read-through, quality crash, contamination and duplication BEFORE they bias calls', out: 'Per-sample QC report; pass/trim/reject decision', key: 'Decide trimming per sample, not globally' },
  { n: '2', t: 'Reference genome + annotation', tool: 'GRCh38 (hg38)  +  GENCODE release', why: 'Alignment is meaningless without a named build; coordinates and gene models are build-specific', out: 'FASTA + GTF, checksum + version recorded', key: 'Name the exact build AND annotation release' },
  { n: '3', t: 'Alignment', tool: 'BWA-MEM2  (DNA)  /  STAR, HISAT2 (RNA)', why: 'Map reads to the reference; MEM2 keeps BWA-MEM accuracy with a faster index', out: 'Coordinate-sorted, indexed BAM/CRAM', key: 'Record aligner version; keep CRAM for size' },
  { n: '4', t: 'Mapped-read processing', tool: 'samtools  +  Picard / GATK BQSR', why: 'Remove PCR duplicates and correct systematic base-quality bias so variant evidence is trustworthy', out: 'Analysis-ready BAM + metrics (dup rate, coverage)', key: 'Duplicate rate is assay-dependent (WGS low, RNA high)' },
  { n: '5', t: 'Assay-specific downstream', tool: 'GATK HaplotypeCaller  →  gVCF + joint genotyping', why: 'The same BAM means different things: variants (WGS), counts (RNA), peaks (ATAC/ChIP), contacts (Hi-C)', out: 'Per-sample gVCF, then a cohort VCF', key: 'gVCF + joint calling keeps no-call evidence consistent' },
  { n: '6', t: 'Filtering + site QC', tool: 'GATK VQSR / hard filters', why: 'Separate true variants from artefacts using depth, allele balance, strand bias and mapping quality', out: 'Filtered, analysis-ready VCF', key: 'Never filter on the phenotype you are testing (VQSR/AB are phenotype-blind)' },
  { n: '7', t: 'Annotation', tool: 'Ensembl VEP  /  SnpEff  +  gnomAD, ClinVar', why: 'Attach gene, consequence, population frequency and clinical context to each variant', out: 'Annotated VCF/TSV', key: 'Annotation DB version changes the answer — record it' },
  { n: '8', t: 'Visualization + interpretation', tool: 'IGV  +  R/Bioconductor (ggplot2)', why: 'Eyeball the pileup, then quantify; never interpret a FILTER flag without looking at the reads', out: 'Figures, ranked shortlist, documented decision', key: 'Interpretation is where human judgement is required' },
];

const colW = 396, rowH = 250, gapX = 24, gapY = 22;
const startX = 40, startY = 172;
for (let i = 0; i < stages.length; i++) {
  const col = i % 4, row = Math.floor(i / 4);
  const x = startX + col * (colW + gapX);
  const y = startY + row * (rowH + gapY);
  const s = stages[i];

  D.roundRect(ctx, x, y, colW, rowH, 10);
  ctx.fillStyle = P.white; ctx.fill();
  ctx.strokeStyle = P.rule; ctx.lineWidth = 1.5; ctx.stroke();

  // number chip
  ctx.beginPath(); ctx.arc(x + 26, y + 26, 15, 0, Math.PI * 2);
  ctx.fillStyle = P.purple; ctx.fill();
  ctx.font = 'bold 14px Arial'; ctx.fillStyle = P.white; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(s.n, x + 26, y + 27);
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';

  ctx.font = 'bold 14.5px Arial'; ctx.fillStyle = P.ink;
  ctx.fillText(s.t, x + 50, y + 14);

  ctx.font = 'bold 12px Arial'; ctx.fillStyle = P.blue;
  ctx.fillText('TOOL', x + 14, y + 52);
  ctx.font = '12px Arial'; ctx.fillStyle = P.ink;
  let ty = y + 68;
  for (const ln of D.wrap(ctx, s.tool, colW - 28)) { ctx.fillText(ln, x + 14, ty); ty += 15; }

  ctx.font = 'bold 12px Arial'; ctx.fillStyle = P.orange;
  ctx.fillText('WHY THIS STEP', x + 14, ty + 6);
  ctx.font = '12px Arial'; ctx.fillStyle = P.ink;
  ty += 22;
  for (const ln of D.wrap(ctx, s.why, colW - 28)) { ctx.fillText(ln, x + 14, ty); ty += 15; }

  ctx.font = 'bold 12px Arial'; ctx.fillStyle = P.green;
  ctx.fillText('OUTPUT', x + 14, ty + 6);
  ctx.font = '12px Arial'; ctx.fillStyle = P.ink;
  ty += 22;
  for (const ln of D.wrap(ctx, s.out, colW - 28)) { ctx.fillText(ln, x + 14, ty); ty += 15; }

  // key parameter note
  ctx.font = 'italic 11.5px Arial'; ctx.fillStyle = P.red;
  let ky = y + rowH - 34;
  for (const ln of D.wrap(ctx, '⚑ ' + s.key, colW - 28)) { ctx.fillText(ln, x + 14, ky); ky += 14; }
}

// flow arrows between the 8 stages
for (let i = 0; i < stages.length; i++) {
  const col = i % 4, row = Math.floor(i / 4);
  const x = startX + col * (colW + gapX);
  const y = startY + row * (rowH + gapY);
  if (col < 3) D.arrow(ctx, x + colW + 3, y + rowH / 2, x + colW + gapX - 3, y + rowH / 2, { color: P.purple, width: 2.5, head: 9 });
  if (col === 3 && row === 0) { // wrap to row 2
    D.arrow(ctx, x + colW / 2, y + rowH + 3, x + colW / 2, y + rowH + gapY - 3, { color: P.purple, width: 2.5, head: 9, dash: [6, 4] });
  }
}

// ---------------- assumptions / provenance bar -------------
const provY = startY + 2 * (rowH + gapY) + 6;
D.roundRect(ctx, 40, provY, 1640, 78, 10);
ctx.fillStyle = P.purpleL; ctx.fill();
ctx.strokeStyle = P.purple; ctx.lineWidth = 2; ctx.stroke();
ctx.font = 'bold 14px Arial'; ctx.fillStyle = P.purple;
ctx.fillText('EVERY STAGE INHERITS FOUR ASSUMPTIONS — record all four, or the result is not reproducible', 58, provY + 12);
const prov = [
  ['Reference build', 'GRCh38.p14 (hg38)'],
  ['Sample identity', 'verify against genotype / manifest'],
  ['Caller + model', 'GATK HaplotypeCaller, joint genotyping'],
  ['Software versions', 'capture with sessionInfo() / conda env'],
];
for (let i = 0; i < prov.length; i++) {
  const x = 60 + i * 405;
  ctx.font = 'bold 11.5px Arial'; ctx.fillStyle = P.sub; ctx.fillText(prov[i][0], x, provY + 38);
  ctx.font = '12px Arial'; ctx.fillStyle = P.ink; ctx.fillText(prov[i][1], x, provY + 55);
}

// ---------------- footer -------------
ctx.strokeStyle = P.rule; ctx.lineWidth = 1;
ctx.beginPath(); ctx.moveTo(40, H - 26); ctx.lineTo(W - 40, H - 26); ctx.stroke();
ctx.font = '11.5px Arial'; ctx.fillStyle = P.sub; ctx.textAlign = 'left';
ctx.fillText('Figure generated for Week 4 Q2. Eight stages, tool choice and the flagged parameters are mine; AI proposed the initial command list, which I verified against official documentation.', 40, H - 18);

const out = path.join(__dirname, '..', 'figures', 'Q2_workflow.png');
fs.writeFileSync(out, c.toBuffer('image/png'));
console.log('wrote', out, c.width + 'x' + c.height);
