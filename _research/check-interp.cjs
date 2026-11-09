const fs = require('fs');
const path = process.argv[2];
const s = fs.readFileSync(path, 'utf8');
const lines = s.split('\n');
let count = 0;
lines.forEach((l, i) => {
  for (let j = 0; j < l.length - 1; j++) {
    if (l[j] === '$' && l[j + 1] === '{') {
      // count preceding backslashes
      let k = j - 1, bs = 0;
      while (k >= 0 && l[k] === '\\') { bs++; k--; }
      if (bs % 2 === 0) {
        count++;
        console.log(`${i + 1}: ${l.trim().slice(0, 140)}`);
        break;
      }
    }
  }
});
console.log('--- unescaped ${ count:', count);
