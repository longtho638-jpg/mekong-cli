const fs = require('fs');
const path = require('path');

const sopsDir = './sops';
const files = fs.readdirSync(sopsDir).filter(f => f.endsWith('.json'));

console.log('Validating SOPs...');
let allValid = true;

files.forEach(f => {
  try {
    const content = fs.readFileSync(path.join(sopsDir, f), 'utf8');
    const sop = JSON.parse(content);
    if (!sop.name || !sop.steps || !Array.isArray(sop.steps)) {
      console.log('X', f, '- Invalid structure');
      allValid = false;
    } else {
      console.log('OK', f, '-', sop.name, '(' + sop.steps.length + ' steps)');
    }
  } catch (e) {
    console.log('X', f, '- JSON parse error:', e.message);
    allValid = false;
  }
});

console.log(allValid ? '\nAll SOPs valid' : '\nSome SOPs invalid');
