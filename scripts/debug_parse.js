const fs = require('fs');
const content = fs.readFileSync('informacoes/listagem_de_beneficiarios/listas de beneficiarios/beneficiarios_consolidado_7_nucleos.md', 'utf8').replace(/\r/g, '');
const sec = content.split('\n# ')[1];
const b = sec.split('\n### ')[1];
const lines = b.split('\n');
console.log('Lines count:', lines.length);
lines.forEach((l, i) => {
  const m = l.match(/^-\s*\*\*(.*?)\*\*:\s*(.*)$/);
  if (m) console.log(i, m[1], ':', m[2]);
});
