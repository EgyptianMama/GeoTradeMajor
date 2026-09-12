/* Generates report figures as SVG, then rasterises them to PNG for embedding
   into the DOCX. Print palette: indigo accent on white, no theme tokens. */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const OUT = path.join(__dirname, 'fig');
fs.mkdirSync(OUT, { recursive: true });

const C = {
  ink: '#16202e',
  indigo: '#2d4a7c',
  muted: '#5c6a7d',
  faint: '#93a0b1',
  rule: '#c9d2de',
  amber: '#a96c12',
  up: '#17765a',
  down: '#a83239',
  wash: '#eef2f8',
};

const wrap = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
<rect width="${w}" height="${h}" fill="#ffffff"/>
<defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><polygon points="0,0 10,5 0,10" fill="${C.ink}"/></marker>
<marker id="ai" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><polygon points="0,0 10,5 0,10" fill="${C.indigo}"/></marker></defs>
<g font-family="Segoe UI, Helvetica, Arial, sans-serif">${body}</g></svg>`;

const box = (x, y, w, h, sw = 1.4, stroke = C.ink, fill = 'none') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
const t = (x, y, s, o = {}) =>
  `<text x="${x}" y="${y}" font-size="${o.fs || 13}" fill="${o.fill || C.ink}" text-anchor="${o.anchor || 'start'}" font-weight="${o.fw || 400}"${o.italic ? ' font-style="italic"' : ''}>${s}</text>`;
const line = (x1, y1, x2, y2, o = {}) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.stroke || C.ink}" stroke-width="${o.sw || 1.4}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.arrow ? ` marker-end="url(#${o.arrow === 'i' ? 'ai' : 'a'})"` : ''}/>`;

const FIGS = {};

/* ---------------- Fig 2.1 — where the edge lives ---------------- */
FIGS['fig-2-1'] = wrap(900, 340, `
${t(20, 26, 'Speed of price discovery by analyst coverage', { fs: 14, fw: 600 })}
${line(90, 280, 860, 280, { stroke: C.rule, sw: 1.2 })}
${line(90, 280, 90, 60, { stroke: C.rule, sw: 1.2 })}
${t(80, 70, 'Fast', { fs: 11, anchor: 'end', fill: C.muted })}
${t(80, 276, 'Slow', { fs: 11, anchor: 'end', fill: C.muted })}
${t(46, 175, 'Adjustment', { fs: 11, anchor: 'middle', fill: C.muted })}

<rect x="130" y="72" width="120" height="208" fill="${C.wash}" stroke="${C.indigo}" stroke-width="1.2"/>
<rect x="300" y="128" width="120" height="152" fill="${C.wash}" stroke="${C.indigo}" stroke-width="1.2"/>
<rect x="470" y="196" width="120" height="84" fill="${C.up}" fill-opacity="0.16" stroke="${C.up}" stroke-width="1.8"/>
<rect x="640" y="232" width="120" height="48" fill="${C.up}" fill-opacity="0.16" stroke="${C.up}" stroke-width="1.8"/>

${t(190, 300, 'NIFTY 50', { fs: 11.5, anchor: 'middle', fill: C.muted })}
${t(360, 300, 'Next 50', { fs: 11.5, anchor: 'middle', fill: C.muted })}
${t(530, 300, 'Midcap 150', { fs: 11.5, anchor: 'middle', fill: C.up, fw: 600 })}
${t(700, 300, 'Smallcap 250', { fs: 11.5, anchor: 'middle', fill: C.up, fw: 600 })}
${t(190, 320, '~35 analysts', { fs: 10, anchor: 'middle', fill: C.faint })}
${t(360, 320, '~14 analysts', { fs: 10, anchor: 'middle', fill: C.faint })}
${t(530, 320, '~4 analysts', { fs: 10, anchor: 'middle', fill: C.faint })}
${t(700, 320, '~1 analyst', { fs: 10, anchor: 'middle', fill: C.faint })}

<rect x="470" y="46" width="290" height="60" fill="none" stroke="${C.up}" stroke-width="1.4" stroke-dasharray="5 3" rx="3"/>
${t(615, 68, 'Target universe', { fs: 12.5, anchor: 'middle', fill: C.up, fw: 600 })}
${t(615, 88, 'slow discovery = exploitable lag', { fs: 11, anchor: 'middle', fill: C.muted })}
${line(615, 106, 615, 190, { stroke: C.up, sw: 1.2, dash: '4 3' })}
`);

/* ---------------- Fig 4.1 — pipeline ---------------- */
FIGS['fig-4-1'] = wrap(940, 360, `
${box(14, 96, 150, 68)}${box(210, 96, 150, 68)}${box(406, 96, 150, 68)}${box(602, 96, 150, 68)}${box(798, 96, 128, 68)}
${t(89, 124, 'Ingestion', { fs: 13, fw: 600, anchor: 'middle' })}
${t(285, 124, 'Entity Link', { fs: 13, fw: 600, anchor: 'middle' })}
${t(481, 124, 'Scoring', { fs: 13, fw: 600, anchor: 'middle' })}
${t(677, 124, 'Feature Store', { fs: 13, fw: 600, anchor: 'middle' })}
${t(862, 124, 'Model', { fs: 13, fw: 600, anchor: 'middle' })}
${t(89, 144, 'RSS + filings', { fs: 10.5, anchor: 'middle', fill: C.muted })}
${t(285, 144, 'text &#8594; ticker', { fs: 10.5, anchor: 'middle', fill: C.muted })}
${t(481, 144, 'tone + surprise', { fs: 10.5, anchor: 'middle', fill: C.muted })}
${t(677, 144, 'join market state', { fs: 10.5, anchor: 'middle', fill: C.muted })}
${t(862, 144, 'rank + calibrate', { fs: 10.5, anchor: 'middle', fill: C.muted })}

${line(164, 130, 204, 130, { arrow: 1 })}
${line(360, 130, 400, 130, { arrow: 1 })}
${line(556, 130, 596, 130, { arrow: 1 })}
${line(752, 130, 792, 130, { arrow: 1 })}
${t(184, 122, 'doc', { fs: 9.5, anchor: 'middle', fill: C.faint })}
${t(380, 122, 'doc+tkr', { fs: 9.5, anchor: 'middle', fill: C.faint })}
${t(576, 122, 'scores', { fs: 9.5, anchor: 'middle', fill: C.faint })}
${t(772, 122, 'vectors', { fs: 9.5, anchor: 'middle', fill: C.faint })}

<rect x="14" y="222" width="738" height="50" rx="3" fill="${C.wash}" stroke="${C.indigo}" stroke-width="1.2" stroke-dasharray="5 3"/>
${t(383, 252, 'Append-only document and score archive &#8212; every stage replayable', { fs: 12, anchor: 'middle', fill: C.indigo })}
${line(89, 164, 89, 222, { stroke: C.indigo, sw: 1, dash: '3 3' })}
${line(285, 164, 285, 222, { stroke: C.indigo, sw: 1, dash: '3 3' })}
${line(481, 164, 481, 222, { stroke: C.indigo, sw: 1, dash: '3 3' })}
${line(677, 164, 677, 222, { stroke: C.indigo, sw: 1, dash: '3 3' })}

${box(602, 22, 150, 46)}
${t(677, 42, 'Market Data', { fs: 12, fw: 600, anchor: 'middle' })}
${t(677, 59, 'EOD OHLCV + index', { fs: 10, anchor: 'middle', fill: C.muted })}
${line(677, 68, 677, 92, { arrow: 1 })}

${box(798, 222, 128, 44)}${box(798, 280, 128, 44)}
${t(862, 249, 'Dashboard', { fs: 12, anchor: 'middle' })}
${t(862, 307, 'Backtester', { fs: 12, anchor: 'middle' })}
${line(862, 164, 862, 218, { arrow: 1 })}
${line(862, 266, 862, 276, { arrow: 1 })}
`);

/* ---------------- Fig 6.1 — entity resolution ---------------- */
FIGS['fig-6-1'] = wrap(940, 330, `
<rect x="14" y="14" width="912" height="42" rx="3" fill="${C.wash}" stroke="${C.rule}" stroke-width="1.2"/>
${t(30, 40, '&#8220;Tata Motors JLR volumes miss estimates; brokerages cut targets on the auto major&#8221;', { fs: 12.5, italic: 1 })}

${box(14, 88, 196, 64)}
${t(112, 112, '1 &#183; Candidate generation', { fs: 12, fw: 600, anchor: 'middle' })}
${t(112, 129, 'NER + alias gazetteer', { fs: 10.5, anchor: 'middle', fill: C.muted })}
${t(112, 143, 'high recall, low precision', { fs: 10.5, anchor: 'middle', fill: C.faint })}

<rect x="244" y="82" width="112" height="21" rx="2" fill="none" stroke="${C.rule}" stroke-width="1.1"/>
${t(300, 97, 'TATAMOTORS', { fs: 10.5, anchor: 'middle', fill: C.ink })}
<rect x="244" y="109" width="112" height="21" rx="2" fill="none" stroke="${C.rule}" stroke-width="1.1"/>
${t(300, 124, 'TATASTEEL', { fs: 10.5, anchor: 'middle', fill: C.faint })}
<rect x="244" y="136" width="112" height="21" rx="2" fill="none" stroke="${C.rule}" stroke-width="1.1"/>
${t(300, 151, 'TCS', { fs: 10.5, anchor: 'middle', fill: C.faint })}

${box(390, 88, 196, 64)}
${t(488, 112, '2 &#183; Disambiguation', { fs: 12, fw: 600, anchor: 'middle' })}
${t(488, 129, 'cross-encoder scores', { fs: 10.5, anchor: 'middle', fill: C.muted })}
${t(488, 143, '(sentence, company card)', { fs: 10.5, anchor: 'middle', fill: C.faint })}

${box(620, 88, 196, 64)}
${t(718, 112, '3 &#183; Threshold', { fs: 12, fw: 600, anchor: 'middle' })}
${t(718, 129, 'accept if conf &#8805; &#964;', { fs: 10.5, anchor: 'middle', fill: C.muted })}
${t(718, 143, 'else discard', { fs: 10.5, anchor: 'middle', fill: C.faint })}

${line(112, 56, 112, 84, { arrow: 1 })}
${line(210, 120, 240, 120, { arrow: 1 })}
${line(360, 120, 384, 120, { arrow: 1 })}
${line(586, 120, 616, 120, { arrow: 1 })}

<rect x="620" y="188" width="196" height="44" rx="2" fill="${C.up}" fill-opacity="0.1" stroke="${C.up}" stroke-width="1.8"/>
${t(718, 208, 'TATAMOTORS', { fs: 12.5, fw: 700, anchor: 'middle', fill: C.up })}
${t(718, 224, 'conf 0.94 &#183; primary subject', { fs: 10.5, anchor: 'middle', fill: C.muted })}
${line(718, 152, 718, 184, { arrow: 1 })}

<rect x="14" y="256" width="912" height="60" rx="3" fill="none" stroke="${C.indigo}" stroke-width="1.2" stroke-dasharray="5 3"/>
${t(28, 279, '4 &#183; Propagation graph', { fs: 12, fw: 600, fill: C.indigo })}
${t(28, 296, 'damped, beta-scaled', { fs: 10.5, fill: C.muted })}
<rect x="300" y="270" width="132" height="24" rx="2" fill="none" stroke="${C.rule}" stroke-width="1.1"/>
${t(366, 286, 'NIFTYAUTO &#183; 0.55', { fs: 10.5, anchor: 'middle', fill: C.muted })}
<rect x="450" y="270" width="132" height="24" rx="2" fill="none" stroke="${C.rule}" stroke-width="1.1"/>
${t(516, 286, 'M&amp;M &#183; 0.31', { fs: 10.5, anchor: 'middle', fill: C.muted })}
<rect x="600" y="270" width="132" height="24" rx="2" fill="none" stroke="${C.rule}" stroke-width="1.1"/>
${t(666, 286, 'MARUTI &#183; 0.28', { fs: 10.5, anchor: 'middle', fill: C.muted })}
<rect x="750" y="270" width="164" height="24" rx="2" fill="none" stroke="${C.rule}" stroke-width="1.1"/>
${t(832, 286, 'MOTHERSON &#183; 0.22', { fs: 10.5, anchor: 'middle', fill: C.muted })}
<path d="M 690 232 C 600 248 420 252 300 272" fill="none" stroke="${C.indigo}" stroke-width="1.3" marker-end="url(#ai)"/>
`);

/* ---------------- Fig 7.1 — tone vs surprise ---------------- */
FIGS['fig-7-1'] = wrap(900, 268, `
<rect x="14" y="14" width="412" height="52" rx="3" fill="${C.wash}" stroke="${C.rule}" stroke-width="1.2"/>
${t(30, 37, '&#8220;L&amp;T wins Rs 9,000 cr order&#8221;', { fs: 12.5, italic: 1 })}
${t(30, 56, 'Unscheduled &#183; no consensus exists', { fs: 10.5, fill: C.muted })}

<rect x="474" y="14" width="412" height="52" rx="3" fill="${C.wash}" stroke="${C.rule}" stroke-width="1.2"/>
${t(490, 37, '&#8220;Infosys profit up 18% YoY&#8221;', { fs: 12.5, italic: 1 })}
${t(490, 56, 'Scheduled &#183; street expected 22%', { fs: 10.5, fill: C.muted })}

${t(220, 100, 'lexicon tone', { fs: 11, anchor: 'middle', fill: C.faint })}
${t(680, 100, 'lexicon tone', { fs: 11, anchor: 'middle', fill: C.faint })}
${box(156, 110, 128, 28, 1.4)}${box(616, 110, 128, 28, 1.4)}
${t(220, 129, 'POSITIVE', { fs: 12.5, fw: 700, anchor: 'middle' })}
${t(680, 129, 'POSITIVE', { fs: 12.5, fw: 700, anchor: 'middle' })}

${line(220, 66, 220, 106, { arrow: 1 })}
${line(680, 66, 680, 106, { arrow: 1 })}
${line(220, 138, 220, 184, { arrow: 1 })}
${line(680, 138, 680, 184, { arrow: 1 })}
${t(300, 164, 'surprise: n/a', { fs: 10.5, fill: C.muted })}
${t(760, 164, 'surprise: &#8722;4 pp', { fs: 10.5, fill: C.down, fw: 600 })}

<rect x="156" y="188" width="128" height="50" rx="3" fill="${C.up}" fill-opacity="0.1" stroke="${C.up}" stroke-width="2"/>
${t(220, 210, 'CAR +2.1%', { fs: 13.5, fw: 700, anchor: 'middle', fill: C.up })}
${t(220, 228, 'tone was right', { fs: 10.5, anchor: 'middle', fill: C.muted })}

<rect x="616" y="188" width="128" height="50" rx="3" fill="${C.down}" fill-opacity="0.1" stroke="${C.down}" stroke-width="2"/>
${t(680, 210, 'CAR &#8722;5.3%', { fs: 13.5, fw: 700, anchor: 'middle', fill: C.down })}
${t(680, 228, 'tone was inverted', { fs: 10.5, anchor: 'middle', fill: C.muted })}

${line(450, 14, 450, 252, { stroke: C.rule, sw: 1, dash: '3 4' })}
`);

/* ---------------- Fig 9.1 — event study timeline ---------------- */
FIGS['fig-9-1'] = wrap(900, 250, `
${line(30, 124, 866, 124, { arrow: 1 })}
<rect x="40" y="90" width="386" height="34" fill="${C.wash}" stroke="${C.indigo}" stroke-width="1.4"/>
${t(233, 112, 'Estimation window &#8212; 120 trading days', { fs: 12, anchor: 'middle', fill: C.indigo })}
${t(233, 74, 'fit &#945;, &#946; by OLS', { fs: 11, anchor: 'middle', fill: C.muted })}

<rect x="426" y="90" width="80" height="34" fill="none" stroke="${C.faint}" stroke-width="1.2" stroke-dasharray="4 3"/>
${t(466, 112, 'gap 10d', { fs: 10.5, anchor: 'middle', fill: C.muted })}

${line(526, 62, 526, 156, { sw: 2.4 })}
${t(526, 54, 'event   t = 0', { fs: 12.5, fw: 700, anchor: 'middle' })}

<rect x="546" y="90" width="224" height="34" fill="${C.up}" fill-opacity="0.1" stroke="${C.up}" stroke-width="2"/>
${t(658, 112, 'CAR [t+1, t+5]', { fs: 12.5, fw: 700, anchor: 'middle', fill: C.up })}
${t(658, 74, 'label measured here', { fs: 11, anchor: 'middle', fill: C.muted })}

${line(590, 124, 590, 134, { stroke: C.faint, sw: 1 })}
${line(634, 124, 634, 134, { stroke: C.faint, sw: 1 })}
${line(678, 124, 678, 134, { stroke: C.faint, sw: 1 })}
${line(722, 124, 722, 134, { stroke: C.faint, sw: 1 })}
${line(766, 124, 766, 134, { stroke: C.faint, sw: 1 })}
${t(590, 148, '+1', { fs: 10, anchor: 'middle', fill: C.muted })}
${t(634, 148, '+2', { fs: 10, anchor: 'middle', fill: C.muted })}
${t(678, 148, '+3', { fs: 10, anchor: 'middle', fill: C.muted })}
${t(722, 148, '+4', { fs: 10, anchor: 'middle', fill: C.muted })}
${t(766, 148, '+5', { fs: 10, anchor: 'middle', fill: C.muted })}

${line(590, 176, 590, 158, { stroke: C.amber, sw: 1.2, arrow: 1 })}
${t(590, 192, 'entry assumed at t+1 open', { fs: 10.5, anchor: 'middle', fill: C.amber })}
${t(40, 224, 'The gap prevents pre-event leakage from contaminating the beta estimate.', { fs: 11, fill: C.muted })}
`);

/* ---------------- Fig 11.1 — walk-forward ---------------- */
FIGS['fig-11-1'] = wrap(900, 262, `
${t(14, 26, '2021', { fs: 11, fill: C.faint })}
${t(226, 26, '2022', { fs: 11, fill: C.faint })}
${t(438, 26, '2023', { fs: 11, fill: C.faint })}
${t(650, 26, '2024', { fs: 11, fill: C.faint })}
${t(828, 26, '2025', { fs: 11, fill: C.faint })}
${line(14, 36, 880, 36, { stroke: C.rule, sw: 1 })}

<rect x="14" y="54" width="276" height="26" fill="${C.wash}" stroke="${C.indigo}" stroke-width="1.2"/>
<rect x="300" y="54" width="20" height="26" fill="none" stroke="${C.amber}" stroke-width="1.2" stroke-dasharray="3 2"/>
<rect x="326" y="54" width="122" height="26" fill="${C.up}" fill-opacity="0.12" stroke="${C.up}" stroke-width="2"/>

<rect x="14" y="96" width="408" height="26" fill="${C.wash}" stroke="${C.indigo}" stroke-width="1.2"/>
<rect x="432" y="96" width="20" height="26" fill="none" stroke="${C.amber}" stroke-width="1.2" stroke-dasharray="3 2"/>
<rect x="458" y="96" width="122" height="26" fill="${C.up}" fill-opacity="0.12" stroke="${C.up}" stroke-width="2"/>

<rect x="14" y="138" width="540" height="26" fill="${C.wash}" stroke="${C.indigo}" stroke-width="1.2"/>
<rect x="564" y="138" width="20" height="26" fill="none" stroke="${C.amber}" stroke-width="1.2" stroke-dasharray="3 2"/>
<rect x="590" y="138" width="122" height="26" fill="${C.up}" fill-opacity="0.12" stroke="${C.up}" stroke-width="2"/>

<rect x="14" y="180" width="672" height="26" fill="${C.wash}" stroke="${C.indigo}" stroke-width="1.2"/>
<rect x="696" y="180" width="20" height="26" fill="none" stroke="${C.amber}" stroke-width="1.2" stroke-dasharray="3 2"/>
<rect x="722" y="180" width="122" height="26" fill="${C.up}" fill-opacity="0.12" stroke="${C.up}" stroke-width="2"/>

${t(24, 72, 'train &#8212; fold 1', { fs: 11, fill: C.indigo })}
${t(24, 114, 'train &#8212; fold 2', { fs: 11, fill: C.indigo })}
${t(24, 156, 'train &#8212; fold 3', { fs: 11, fill: C.indigo })}
${t(24, 198, 'train &#8212; fold 4', { fs: 11, fill: C.indigo })}
${t(387, 72, 'test', { fs: 11, fw: 600, anchor: 'middle', fill: C.up })}
${t(519, 114, 'test', { fs: 11, fw: 600, anchor: 'middle', fill: C.up })}
${t(651, 156, 'test', { fs: 11, fw: 600, anchor: 'middle', fill: C.up })}
${t(783, 198, 'test', { fs: 11, fw: 600, anchor: 'middle', fill: C.up })}

${t(310, 236, 'embargo', { fs: 10.5, anchor: 'middle', fill: C.amber })}
${line(310, 224, 310, 212, { stroke: C.amber, sw: 1 })}
${t(420, 236, 'Embargo width = label horizon H, so no training label window reaches into a test period.', { fs: 11, fill: C.muted })}
`);

/* ---------------- Fig 12.1 — decile spread ---------------- */
FIGS['fig-12-1'] = wrap(900, 330, `
${t(20, 26, 'Expected evaluation output: mean 5-day CAR by predicted-score decile', { fs: 14, fw: 600 })}
${line(70, 190, 860, 190, { stroke: C.ink, sw: 1.4 })}
${line(70, 60, 70, 300, { stroke: C.rule, sw: 1.2 })}
${t(62, 76, '+80', { fs: 10.5, anchor: 'end', fill: C.muted })}
${t(62, 194, '0', { fs: 10.5, anchor: 'end', fill: C.muted })}
${t(62, 292, '&#8722;80', { fs: 10.5, anchor: 'end', fill: C.muted })}
${t(30, 140, 'bps', { fs: 10.5, anchor: 'middle', fill: C.muted })}

${[[-62, 1], [-41, 2], [-28, 3], [-14, 4], [-6, 5], [4, 6], [11, 7], [24, 8], [43, 9], [71, 10]]
  .map(([v, i]) => {
    const x = 92 + (i - 1) * 76;
    const h = Math.abs(v) * 1.42;
    const y = v >= 0 ? 190 - h : 190;
    const col = v >= 0 ? C.up : C.down;
    return `<rect x="${x}" y="${y}" width="52" height="${h}" fill="${col}" fill-opacity="0.75" stroke="${col}" stroke-width="1.1"/>` +
      t(x + 26, v >= 0 ? y - 7 : y + h + 15, (v > 0 ? '+' : '') + v, { fs: 10.5, anchor: 'middle', fill: col, fw: 600 }) +
      t(x + 26, 316, 'D' + i, { fs: 10.5, anchor: 'middle', fill: C.faint });
  }).join('')}

<rect x="620" y="46" width="260" height="52" rx="3" fill="none" stroke="${C.indigo}" stroke-width="1.3" stroke-dasharray="5 3"/>
${t(750, 68, 'Long&#8211;short spread = D10 &#8722; D1', { fs: 11.5, anchor: 'middle', fill: C.indigo, fw: 600 })}
${t(750, 86, '133 bps &#183; the headline number', { fs: 11, anchor: 'middle', fill: C.muted })}
${t(70, 322, 'Illustrative target shape, not a result. Monotonicity across deciles matters more than the endpoints.', { fs: 10.5, fill: C.faint })}
`);

/* ---------------- Fig 15.1 — roadmap ---------------- */
FIGS['fig-15-1'] = wrap(960, 306, `
${t(20, 26, 'Phase sequence with decision gates', { fs: 14, fw: 600 })}
${[
  ['Phase 0', 'Historical corpus', 0, 168, C.indigo],
  ['Phase 1', 'Labels + baseline model', 132, 168, C.up],
  ['Phase 2', 'Entity resolution + features', 264, 186, C.indigo],
  ['Phase 3', 'Neural sentiment', 414, 136, C.indigo],
  ['Phase 4', 'Propagation + sequence', 528, 168, C.indigo],
  ['Phase 5', 'Live paper trading', 660, 148, C.up],
].map(([tag, label, x, w, col], i) => {
  const y = 58 + i * 36;
  const bx = 78 + x;
  return `<rect x="${bx}" y="${y}" width="${w}" height="25" rx="2" fill="${col}" fill-opacity="0.12" stroke="${col}" stroke-width="1.5"/>` +
    t(14, y + 17, tag, { fs: 10.5, fill: C.faint, fw: 600 }) +
    t(bx + 8, y + 17, label, { fs: 11.5, fill: col, fw: 600 }) +
    `<circle cx="${bx + w + 10}" cy="${y + 12}" r="5" fill="none" stroke="${C.amber}" stroke-width="1.6"/>`;
}).join('')}
${t(14, 288, 'Open circle marks a decision gate. A failed gate stops the phase rather than deferring it.', { fs: 10.5, fill: C.amber })}
${line(14, 272, 946, 272, { stroke: C.rule, sw: 1 })}
`);

/* ---------------- render ---------------- */
(async () => {
  for (const [name, svg] of Object.entries(FIGS)) {
    const svgPath = path.join(OUT, `${name}.svg`);
    fs.writeFileSync(svgPath, svg, 'utf8');
    const info = await sharp(Buffer.from(svg), { density: 300 })
      .png()
      .resize({ width: 1900, fit: 'inside', withoutEnlargement: false })
      .toFile(path.join(OUT, `${name}.png`));
    console.log(`${name}.png  ${info.width}x${info.height}`);
  }
})();
