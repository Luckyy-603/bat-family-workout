// Extracts the program + exercise data embedded in index.html and writes an
// Excel workbook (.xlsx). Run: node scripts/export-xlsx.js
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

// Pull out the const declarations we need and eval them in a sandbox.
// Each block runs from `const NAME=` up to the line `};` (objects) or `];` (arrays).
function grab(name, opener, closer) {
  const start = html.indexOf('const ' + name + '=' + opener);
  if (start === -1) throw new Error('cannot find ' + name);
  // find the matching terminator that sits at column 0
  const re = new RegExp('^' + closer.replace(/[\]}]/g, '\\$&') + ';$', 'm');
  re.lastIndex = start;
  const rest = html.slice(start);
  const m = rest.match(re);
  if (!m) throw new Error('cannot find end of ' + name);
  return rest.slice(0, m.index + m[0].length);
}

const src = [
  grab('EX', '{', '}'),
  grab('WARMUP_EX', '[', ']'),
  grab('P5', '{', '}'),
  grab('P6', '{', '}'),
  grab('PPL', '{', '}'),
  grab('PROGRESSION', '[', ']'),
].join('\n');

// eslint-disable-next-line no-eval
const sandbox = {};
const fn = new Function(src + '\nreturn {EX,WARMUP_EX,P5,P6,PPL,PROGRESSION};');
const { EX, WARMUP_EX, P5, P6, PPL, PROGRESSION } = fn();

const exName = (id) => (EX[id] ? EX[id].name : id);

const wb = XLSX.utils.book_new();

function addSheet(name, rows) {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  // auto width
  const colCount = Math.max(...rows.map((r) => r.length));
  ws['!cols'] = Array.from({ length: colCount }, (_, c) => {
    let w = 10;
    rows.forEach((r) => {
      const v = r[c] == null ? '' : String(r[c]);
      w = Math.max(w, Math.min(60, v.length + 2));
    });
    return { wch: w };
  });
  XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
}

// ── Exercise Library ──────────────────────────────────────────────────────────
const exHeader = ['ID', 'Name', 'Category', 'Muscles', 'Instructions'];
const exRows = Object.entries(EX).map(([id, e]) => [
  id, e.name, e.cat, (e.muscles || []).join(', '), e.info,
]);
exRows.sort((a, b) => a[1].localeCompare(b[1]));
addSheet('Exercise Library', [exHeader, ...exRows]);

// ── Global Warm-Up ────────────────────────────────────────────────────────────
const warmRows = WARMUP_EX.map((w) => [exName(w.exId), w.reps, w.note || '']);
addSheet('Warm-Up Template', [['Exercise', 'Reps / Duration', 'Note'], ...warmRows]);

// ── One sheet per program ─────────────────────────────────────────────────────
function programSheet(p) {
  const header = ['Day #', 'Day Name', 'Theme', 'Block', 'Block Type',
    'Exercise', 'Sets', 'Reps', 'Rest', 'Coach Notes'];
  const rows = [header];
  p.days.forEach((d) => {
    d.blocks.forEach((b) => {
      b.ex.forEach((x) => {
        rows.push([
          d.num, d.name, d.theme, b.name, b.type,
          exName(x.id),
          x.sets == null ? '' : x.sets,
          x.reps == null ? '' : x.reps,
          x.rest == null ? '' : x.rest,
          x.note || '',
        ]);
      });
    });
  });
  return rows;
}
addSheet('5-Day Program', programSheet(P5));
addSheet('6-Day Program', programSheet(P6));
addSheet('PPL Program', programSheet(PPL));

// ── Progression Reference ─────────────────────────────────────────────────────
const progRows = PROGRESSION.map((p) => [p.wk, p.phase, p.tip]);
addSheet('Progression', [['Week', 'Phase', 'Guidance'], ...progRows]);

const out = path.join(__dirname, '..', 'bat-family-workout.xlsx');
XLSX.writeFile(wb, out);
console.log('Wrote', out);
console.log('Sheets:', wb.SheetNames.join(' | '));
console.log('Exercises:', exRows.length,
  '| 5-Day rows:', programSheet(P5).length - 1,
  '| 6-Day rows:', programSheet(P6).length - 1,
  '| PPL rows:', programSheet(PPL).length - 1);
