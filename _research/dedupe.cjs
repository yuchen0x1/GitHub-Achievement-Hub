const fs = require('fs');
const file = process.argv[2];
const lines = fs.readFileSync(file, 'utf8').split('\n');
const out = [];
let i = 0;
let removed = 0;

const isKey = (l) => /^    [a-zA-Z][a-zA-Z0-9]*:/.test(l);

while (i < lines.length) {
  if (lines[i] === '    descriptionEn:') {
    // block spans from descriptionEn up to (not including) the next top-level key
    let end = i + 1;
    while (end < lines.length && !isKey(lines[end])) end++;

    // find previous descriptionEn block
    let prevStart = -1;
    for (let k = i - 1; k >= 0; k--) {
      if (lines[k] === '    descriptionEn:') { prevStart = k; break; }
    }
    if (prevStart !== -1) {
      let prevEnd = prevStart + 1;
      while (prevEnd < lines.length && !isKey(lines[prevEnd])) prevEnd++;
      const norm = (a) => a.join('\n').replace(/\s+/g, ' ').trim();
      if (norm(lines.slice(prevStart, prevEnd)) === norm(lines.slice(i, end))) {
        i = end;
        removed++;
        continue;
      }
    }
  }
  out.push(lines[i]);
  i++;
}

fs.writeFileSync(file, out.join('\n'));
console.log('removed duplicate description blocks:', removed);
