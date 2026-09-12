/* GeoTrade — Technical Design Report (GT-TDR-002)
   Builds a formatted A4 Word report with front matter, numbered sections,
   figures, tables, equations and code listings. */

const fs = require('fs');
const path = require('path');
const D = require('docx');

const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  ImageRun, PageBreak, TableOfContents, Header, Footer, PageNumber,
  NumberFormat, LevelFormat, TabStopType, Tab, convertInchesToTwip,
} = D;

const FIG = path.join(__dirname, 'fig');

/* ---------- page geometry (A4) ---------- */
const PAGE_W = 11906, PAGE_H = 16838;
const MARGIN = 1418;                       // 2.5 cm
const CONTENT_W = PAGE_W - MARGIN * 2;     // 9070 DXA
const IMG_W = 600;                          // px at 96 dpi ≈ content width

/* ---------- palette ---------- */
const INK = '16202E', INDIGO = '2D4A7C', MUTED = '5C6A7D', FAINT = '93A0B1';
const AMBER = 'A96C12', UP = '17765A', DOWN = 'A83239';
const WASH = 'EEF2F8', CODEBG = 'F3F6FA', RULE = 'C9D2DE';

/* ================= helpers ================= */

const P = (text, o = {}) => new Paragraph({
  spacing: { after: o.after ?? 140, line: o.line ?? 288, before: o.before ?? 0 },
  alignment: o.align,
  indent: o.indent,
  children: [new TextRun({
    text, font: o.font ?? 'Calibri', size: o.size ?? 21,
    color: o.color ?? INK, bold: o.bold, italics: o.italics,
  })],
});

/* Rich paragraph: array of ['text', {bold:true}] pairs or plain strings. */
const RP = (parts, o = {}) => new Paragraph({
  spacing: { after: o.after ?? 140, line: 288 },
  alignment: o.align,
  children: parts.map((p) => {
    const [txt, opt = {}] = Array.isArray(p) ? p : [p, {}];
    return new TextRun({
      text: txt, font: opt.font ?? 'Calibri', size: opt.size ?? 21,
      bold: opt.bold, italics: opt.italics, color: opt.color ?? INK,
    });
  }),
});

const H1 = (num, text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 400, after: 200 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: INDIGO, space: 6 } },
  children: [
    new TextRun({ text: `${num}  `, font: 'Cambria', size: 30, bold: true, color: INDIGO }),
    new TextRun({ text, font: 'Cambria', size: 30, bold: true, color: INK }),
  ],
  pageBreakBefore: true,
});

const H2 = (num, text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 300, after: 130 },
  children: [
    new TextRun({ text: `${num}  `, font: 'Cambria', size: 24, bold: true, color: INDIGO }),
    new TextRun({ text, font: 'Cambria', size: 24, bold: true, color: INK }),
  ],
});

const H3 = (num, text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 220, after: 100 },
  children: [
    new TextRun({ text: `${num}  `, font: 'Calibri', size: 21, bold: true, color: INDIGO }),
    new TextRun({ text, font: 'Calibri', size: 21, bold: true, color: INK }),
  ],
});

const BULLET = (items) => items.map((txt) => new Paragraph({
  numbering: { reference: 'gt-bullets', level: 0 },
  spacing: { after: 70, line: 276 },
  children: [new TextRun({ text: txt, font: 'Calibri', size: 21, color: INK })],
}));

const NUMLIST = (items) => items.map((txt) => new Paragraph({
  numbering: { reference: 'gt-numbers', level: 0 },
  spacing: { after: 70, line: 276 },
  children: [new TextRun({ text: txt, font: 'Calibri', size: 21, color: INK })],
}));

/* Equation, centred, with a right-aligned number. */
const EQ = (expr, no) => new Paragraph({
  spacing: { before: 140, after: 40 },
  tabStops: [
    { type: TabStopType.CENTER, position: Math.floor(CONTENT_W / 2) },
    { type: TabStopType.RIGHT, position: CONTENT_W },
  ],
  children: [
    new TextRun({ children: [new Tab()] }),
    new TextRun({ text: expr, font: 'Cambria', size: 23, italics: true, color: INK }),
    new TextRun({ children: [new Tab()] }),
    new TextRun({ text: `(${no})`, font: 'Calibri', size: 19, color: MUTED }),
  ],
});

const WHERE = (text) => new Paragraph({
  spacing: { after: 180, line: 264 },
  indent: { left: 340 },
  children: [
    new TextRun({ text: 'where  ', font: 'Calibri', size: 19, italics: true, color: MUTED }),
    new TextRun({ text, font: 'Calibri', size: 19, color: MUTED }),
  ],
});

/* Shaded callout box. */
const CALLOUT = (label, text) => new Table({
  width: { size: CONTENT_W, type: WidthType.DXA },
  columnWidths: [CONTENT_W],
  borders: {
    top: { style: BorderStyle.NONE },
    left: { style: BorderStyle.SINGLE, size: 18, color: AMBER },
    bottom: { style: BorderStyle.NONE },
    right: { style: BorderStyle.NONE },
    insideHorizontal: { style: BorderStyle.NONE },
    insideVertical: { style: BorderStyle.NONE },
  },
  rows: [new TableRow({
    children: [new TableCell({
      width: { size: CONTENT_W, type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: 'FBF4E7' },
      margins: { top: 140, bottom: 140, left: 200, right: 200 },
      children: [
        new Paragraph({
          spacing: { after: 60 },
          children: [new TextRun({
            text: label.toUpperCase(), font: 'Calibri', size: 16,
            bold: true, color: AMBER, characterSpacing: 30,
          })],
        }),
        new Paragraph({
          spacing: { after: 0, line: 276 },
          children: [new TextRun({ text, font: 'Calibri', size: 20, color: INK })],
        }),
      ],
    })],
  })],
});

/* Data table with header row and caption. */
const TBL = (caption, headers, rows, widths) => {
  const total = widths.reduce((a, b) => a + b, 0);
  const cols = widths.map((w) => Math.round((w / total) * CONTENT_W));
  const diff = CONTENT_W - cols.reduce((a, b) => a + b, 0);
  cols[cols.length - 1] += diff;

  const cell = (txt, i, opt = {}) => new TableCell({
    width: { size: cols[i], type: WidthType.DXA },
    shading: opt.head ? { type: ShadingType.CLEAR, fill: WASH } : undefined,
    margins: { top: 70, bottom: 70, left: 110, right: 110 },
    children: [new Paragraph({
      spacing: { after: 0, line: 250 },
      children: [new TextRun({
        text: String(txt),
        font: opt.mono ? 'Consolas' : 'Calibri',
        size: opt.head ? 17 : 18,
        bold: opt.head || opt.bold,
        color: opt.head ? INDIGO : (opt.color ?? INK),
      })],
    })],
  });

  return [
    new Table({
      width: { size: CONTENT_W, type: WidthType.DXA },
      columnWidths: cols,
      borders: {
        top: { style: BorderStyle.SINGLE, size: 8, color: INDIGO },
        left: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.SINGLE, size: 8, color: INDIGO },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: RULE },
        insideVertical: { style: BorderStyle.NONE },
      },
      rows: [
        new TableRow({
          tableHeader: true,
          children: headers.map((h, i) => cell(h, i, { head: true })),
        }),
        ...rows.map((r) => new TableRow({
          children: r.map((c, i) => {
            if (c && typeof c === 'object' && 'v' in c) return cell(c.v, i, c);
            return cell(c, i, { mono: i === 0 && String(c).length <= 12 });
          }),
        })),
      ],
    }),
    new Paragraph({
      spacing: { before: 80, after: 220 },
      children: [
        new TextRun({ text: caption.split('—')[0].trim() + '  ', font: 'Calibri', size: 17, bold: true, color: INDIGO }),
        new TextRun({ text: caption.split('—').slice(1).join('—').trim(), font: 'Calibri', size: 17, color: MUTED, italics: true }),
      ],
    }),
  ];
};

/* Figure with caption. */
const FIGURE = (file, caption) => {
  const buf = fs.readFileSync(path.join(FIG, file));
  const meta = require('child_process');
  // dimensions are known from generation; derive height from the SVG aspect
  const ASPECT = {
    'fig-2-1.png': 718 / 1900, 'fig-4-1.png': 728 / 1900, 'fig-6-1.png': 667 / 1900,
    'fig-7-1.png': 566 / 1900, 'fig-9-1.png': 528 / 1900, 'fig-11-1.png': 553 / 1900,
    'fig-12-1.png': 697 / 1900, 'fig-15-1.png': 606 / 1900,
  };
  const h = Math.round(IMG_W * (ASPECT[file] ?? 0.4));
  return [
    new Paragraph({
      spacing: { before: 180, after: 60 },
      alignment: AlignmentType.CENTER,
      children: [new ImageRun({ data: buf, type: 'png', transformation: { width: IMG_W, height: h } })],
    }),
    new Paragraph({
      spacing: { after: 240 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: caption.split('—')[0].trim() + '  ', font: 'Calibri', size: 17, bold: true, color: INDIGO }),
        new TextRun({ text: caption.split('—').slice(1).join('—').trim(), font: 'Calibri', size: 17, color: MUTED, italics: true }),
      ],
    }),
  ];
};

/* Code listing. Rendered as a single-cell table: docx-js serialises
   paragraph borders in a fixed order that violates the OOXML schema when
   bottom, left and right are combined, so the box is drawn by the table. */
const CODE = (filename, lines) => {
  const bar = new Paragraph({
    spacing: { before: 0, after: 60 },
    shading: { type: ShadingType.CLEAR, fill: 'E4EAF3' },
    children: [
      new TextRun({ text: ' PYTHON   ', font: 'Calibri', size: 15, bold: true, color: INDIGO }),
      new TextRun({ text: filename, font: 'Consolas', size: 16, color: MUTED }),
    ],
  });

  const body = lines.map((ln) => new Paragraph({
    spacing: { after: 0, line: 232 },
    children: [new TextRun({
      text: ln === '' ? ' ' : ln,
      font: 'Consolas',
      size: 16,
      color: ln.trim().startsWith('#') || ln.trim().startsWith('"""') ? MUTED : INK,
    })],
  }));

  return [
    new Table({
      width: { size: CONTENT_W, type: WidthType.DXA },
      columnWidths: [CONTENT_W],
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: RULE },
        left: { style: BorderStyle.SINGLE, size: 4, color: RULE },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE },
        right: { style: BorderStyle.SINGLE, size: 4, color: RULE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      },
      rows: [new TableRow({
        children: [new TableCell({
          width: { size: CONTENT_W, type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, fill: CODEBG },
          margins: { top: 60, bottom: 100, left: 160, right: 120 },
          children: [bar, ...body],
        })],
      })],
    }),
    new Paragraph({ spacing: { after: 220 }, children: [] }),
  ];
};

const SPACER = (n = 1) => Array.from({ length: n }, () =>
  new Paragraph({ spacing: { after: 0 }, children: [] }));

const RULE_P = () => new Paragraph({
  spacing: { before: 60, after: 200 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: RULE, space: 2 } },
  children: [],
});

/* ================= front matter ================= */

const titlePage = [
  ...SPACER(4),
  new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({
      text: 'TECHNICAL DESIGN REPORT', font: 'Calibri', size: 20,
      bold: true, color: INDIGO, characterSpacing: 60,
    })],
  }),
  new Paragraph({
    spacing: { after: 60 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: INDIGO, space: 10 } },
    children: [],
  }),
  new Paragraph({
    spacing: { before: 260, after: 60 },
    children: [new TextRun({ text: 'GeoTrade', font: 'Cambria', size: 88, bold: true, color: INK })],
  }),
  new Paragraph({
    spacing: { after: 340 },
    children: [new TextRun({
      text: 'A news-sentiment signal architecture for multi-day equity movement on Indian markets',
      font: 'Cambria', size: 28, italics: true, color: MUTED,
    })],
  }),
  ...TBL('', ['Field', 'Value'], [
    ['Document number', 'GT-TDR-002'],
    ['Revision', '2.0 — Draft for build'],
    ['Subject system', 'GeoTrade research platform'],
    ['Market scope', 'India — NSE and BSE cash equities'],
    ['Prediction horizon', '1 to 5 trading days'],
    ['Classification', 'Personal research — not for distribution'],
    ['Prepared by', 'Project author'],
    ['Status', 'Issued for implementation'],
  ], [30, 70]),
  ...SPACER(2),
  new Paragraph({
    spacing: { after: 0 },
    children: [new TextRun({
      text: 'This document specifies a research system. Its outputs are research artefacts and do not constitute investment advice.',
      font: 'Calibri', size: 18, italics: true, color: MUTED,
    })],
  }),
  new Paragraph({ children: [new PageBreak()] }),
];

const frontMatter = [
  H1('', 'Document Control'),
  P('This report supersedes GT-TDR-001 Rev 1.0. It expands the architecture specification with market-context analysis, an execution-cost model, interface contracts, a governance section and an extended appendix set.'),
  H2('', 'Revision History'),
  ...TBL('Table i — Revision history.', ['Rev', 'Date', 'Summary of change', 'Status'], [
    ['1.0', '—', 'Initial architecture, literature review, label methodology, model ladder', 'Superseded'],
    ['2.0', '—', 'Added Indian market context (§2), execution costs (§13), interfaces (§14), governance (§17), future work (§18); expanded all existing sections', 'Current'],
  ], [10, 14, 60, 16]),

  H2('', 'Executive Summary'),
  P('GeoTrade ingests Indian financial news and exchange filings in near real time, resolves the listed securities each story concerns, scores the directional content of the story, and predicts market-adjusted returns for those securities over a one-to-five trading day horizon.'),
  P('The system rests on a single empirical premise: price discovery in Indian equities is not uniformly fast. Coverage concentrates in the largest names, and below that concentration the interval between a story being published and being fully priced widens. That interval is the only place a system built on public data can find an edge, and the architecture is organised to locate it rather than to assume it.'),
  RP([
    ['Three design commitments distinguish this specification from a conventional sentiment pipeline. ', {}],
    ['First', { bold: true }],
    [', the prediction target is the abnormal return — the market-model residual — not the raw return, because a raw-return label rewards beta exposure and reports an edge that does not exist. ', {}],
    ['Second', { bold: true }],
    [', the predictor for anticipated events is the deviation from consensus rather than the tone of the language, because a record profit that misses expectations is a negative event and tone-based scoring gets its sign backwards. ', {}],
    ['Third', { bold: true }],
    [', the unit of prediction is a (security, event) pair rather than a document, because one story moves several securities by different magnitudes and occasionally in opposite directions.', {}],
  ]),
  P('Delivery is phased, and each phase terminates in a gate that can stop the project. Phase 1 — event-study labels, a lexicon baseline and a logistic model — exists specifically to answer whether any exploitable signal survives at public-feed latency, and is deliberately scheduled before any transformer work. The honest prior is that little or no edge will be found in the NIFTY 50 and that something may be found in the mid and small-cap tail. The reporting design in Section 12 makes that outcome a finding rather than a failure.'),
  P('The document specifies the data layer, entity-resolution stack, sentiment and surprise modelling, the full feature set, label construction, a four-rung model ladder, walk-forward validation with embargo, an execution-cost model, and the regulatory position of the project as personal research.'),
  new Paragraph({ children: [new PageBreak()] }),

  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: INDIGO, space: 6 } },
    children: [new TextRun({ text: 'Contents', font: 'Cambria', size: 30, bold: true, color: INK })],
  }),
  new TableOfContents('Contents', {
    hyperlink: true, headingStyleRange: '1-3', captionLabel: undefined,
  }),
  new Paragraph({ children: [new PageBreak()] }),

  H1('', 'Figures, Tables and Abbreviations'),
  H2('', 'List of Figures'),
  ...TBL('', ['Figure', 'Title', 'Section'], [
    ['Figure 2.1', 'Speed of price discovery by analyst coverage', '2.2'],
    ['Figure 4.1', 'Pipeline stages and the replay layer', '4.2'],
    ['Figure 6.1', 'Two-stage entity resolution with propagation', '6.3'],
    ['Figure 7.1', 'Identical tone, opposite outcome', '7.1'],
    ['Figure 9.1', 'Event-study estimation and event windows', '9.3'],
    ['Figure 11.1', 'Walk-forward folds with embargo', '11.1'],
    ['Figure 12.1', 'Mean abnormal return by predicted-score decile', '12.2'],
    ['Figure 15.1', 'Phase sequence with decision gates', '15.1'],
  ], [18, 62, 20]),

  H2('', 'List of Tables'),
  ...TBL('', ['Table', 'Title', 'Section'], [
    ['Table 1.1', 'Research hypotheses', '1.4'],
    ['Table 1.2', 'Objectives and acceptance criteria', '1.5'],
    ['Table 2.1', 'Microstructure constraints and design impact', '2.3'],
    ['Table 3.1', 'Literature gap analysis', '3.7'],
    ['Table 4.1', 'Stage responsibilities and technology selection', '4.3'],
    ['Table 5.1', 'Source tiers', '5.1'],
    ['Table 5.2', 'Data quality assertions', '5.7'],
    ['Table 6.1', 'Entity resolution failure modes', '6.1'],
    ['Table 7.1', 'Sentiment model ladder', '7.2'],
    ['Table 8.1', 'Feature dictionary', '8.2'],
    ['Table 9.1', 'Label horizon specifications', '9.4'],
    ['Table 10.1', 'Model ladder', '10.1'],
    ['Table 10.2', 'LightGBM hyperparameter ranges', '10.3'],
    ['Table 12.1', 'Evaluation metrics and thresholds', '12.5'],
    ['Table 13.1', 'Round-trip cost model', '13.1'],
    ['Table 16.1', 'Risk register', '16.1'],
    ['Table B.1', 'Notation', 'App. B'],
    ['Table C.1', 'Glossary of Indian market terms', 'App. C'],
  ], [16, 64, 20]),

  H2('', 'Abbreviations'),
  ...TBL('', ['Term', 'Expansion'], [
    ['ABSA', 'Aspect-Based Sentiment Analysis'],
    ['ADV', 'Average Daily Volume'],
    ['AR / CAR', 'Abnormal Return / Cumulative Abnormal Return'],
    ['ASM / GSM', 'Additional / Graded Surveillance Measure'],
    ['BSE', 'BSE Limited, formerly Bombay Stock Exchange'],
    ['DII / FII / FPI', 'Domestic / Foreign Institutional Investor; Foreign Portfolio Investor'],
    ['F&O', 'Futures and Options segment'],
    ['IC / IR', 'Information Coefficient / Information Ratio'],
    ['LGBM', 'LightGBM gradient boosting framework'],
    ['MPC', 'Monetary Policy Committee of the Reserve Bank of India'],
    ['NER', 'Named Entity Recognition'],
    ['NSE', 'National Stock Exchange of India'],
    ['OLS', 'Ordinary Least Squares'],
    ['RBI', 'Reserve Bank of India'],
    ['SEBI', 'Securities and Exchange Board of India'],
    ['SESTM', 'Sentiment Extraction via Screening and Topic Modeling'],
    ['STT', 'Securities Transaction Tax'],
  ], [24, 76]),
];

module.exports = {
  D, FIG, PAGE_W, PAGE_H, MARGIN, CONTENT_W, IMG_W,
  INK, INDIGO, MUTED, FAINT, AMBER, UP, DOWN, WASH, CODEBG, RULE,
  P, RP, H1, H2, H3, BULLET, NUMLIST, EQ, WHERE, CALLOUT, TBL, FIGURE, CODE,
  SPACER, RULE_P, titlePage, frontMatter,
};
