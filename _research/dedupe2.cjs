const fs = require('fs');
const file = process.argv[2];
const lines = fs.readFileSync(file, 'utf8').split('\n');
const isKey = (l) => /^    [a-zA-Z][a-zA-Z0-9]*:/.test(l);
const out = [];
let i = 0;
let removed = 0;

while (i < lines.length) {
  const m = /^    ([a-zA-Z][a-zA-Z0-9]*):$/.exec(lines[i]);
  if (m) {
    const key = m[1];
    let end = i + 1;
    while (end < lines.length && !isKey(lines[end])) end++;
    const cur = lines.slice(i, end).join('\n').replace(/\s+/g, ' ').trim();

    // look for the previous block with the same key in the same object
    let prevStart = -1;
    for (let k = out.length - 1; k >= 0; k--) {
      if (out[k] === `    ${key}:`) { prevStart = k; break; }
      if (isKey(out[k])) break; // different key -> different object boundary
    }
    if (prevStart !== -1) {
      let prevEnd = prevStart + 1;
      while (prevEnd < out.length && !isKey(out[prevEnd])) prevEnd++;
      const prev = out.slice(prevStart, prevEnd).join('\n').replace(/\s+/g, ' ').trim();
      if (prev === cur) {
        removed++;
        i = end;
        continue;
      }
    }
  }
  out.push(lines[i]);
  i++;
}

fs.writeFileSync(file, out.join('\n'));
console.log('removed duplicate blocks:', removed);
