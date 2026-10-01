const fs = require('fs');
const path = require('path');

const mdPath = path.join(__dirname, '../informacoes/listagem_de_beneficiarios/listas de beneficiarios/beneficiarios_consolidado_7_nucleos.md');
const rawContent = fs.readFileSync(mdPath, 'utf8');
const content = rawContent.replace(/\r\n/g, '\n');

// Dividir por seções de núcleo
const nucleosSections = content.split(/^# /m).slice(1);
const todosAlunos = [];

for (const sec of nucleosSections) {
  const lines = sec.split('\n');
  const nucleoHeader = lines[0].trim();
  if (nucleoHeader.startsWith('Listagem') || nucleoHeader.startsWith('Resumo')) continue;

  const alunoBlocks = sec.split(/^### /m).slice(1);
  for (const block of alunoBlocks) {
    const aluno = {};
    const itemLines = block.split('\n');
    for (const line of itemLines) {
      const m = line.match(/^-\s*\*\*(.*?)\*\*:\s*(.*)$/);
      if (m) {
        aluno[m[1].trim()] = m[2].trim();
      }
    }
    if (aluno['Nome do aluno']) {
      todosAlunos.push(aluno);
    }
  }
}

console.log('Total de alunos lidos do arquivo consolidado:', todosAlunos.length);

// Analisar CPFs duplicados
const cpfCount = {};
for (const a of todosAlunos) {
  const cpf = a['CPF do aluno'];
  if (cpf && cpf !== '—') {
    cpfCount[cpf] = (cpfCount[cpf] || 0) + 1;
  }
}

const duplicados = new Set();
for (const [cpf, cnt] of Object.entries(cpfCount)) {
  if (cnt > 1) duplicados.add(cpf);
}

console.log('Total de CPFs duplicados únicos:', duplicados.size);
let alunosComCpfDuplicado = 0;
let alunosSemCpf = 0;
let alunosComCpfValidoUnico = 0;

for (const a of todosAlunos) {
  const cpf = a['CPF do aluno'];
  if (!cpf || cpf === '—') {
    alunosSemCpf++;
  } else if (duplicados.has(cpf)) {
    alunosComCpfDuplicado++;
  } else {
    alunosComCpfValidoUnico++;
  }
}

console.log({
  alunosComCpfValidoUnico,
  alunosComCpfDuplicado,
  alunosSemCpf,
  total: alunosComCpfValidoUnico + alunosComCpfDuplicado + alunosSemCpf
});
