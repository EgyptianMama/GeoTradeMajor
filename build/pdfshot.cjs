const { pdf } = require('pdf-to-img');
const fs = require('fs');
const path = require('path');
(async () => {
  const out = path.join(__dirname, 'pages');
  fs.mkdirSync(out, { recursive: true });
  const doc = await pdf(path.join(__dirname, '..', 'docs', 'GeoTrade-Technical-Design-Report.pdf'), { scale: 1.6 });
  const want = new Set(process.argv.slice(2).map(Number));
  let i = 0;
  for await (const page of doc) {
    i++;
    if (want.size && !want.has(i)) continue;
    fs.writeFileSync(path.join(out, `p${String(i).padStart(2, '0')}.png`), page);
    console.log('page', i);
    if (want.size && i >= Math.max(...want)) break;
  }
  console.log('total pages seen:', i);
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
