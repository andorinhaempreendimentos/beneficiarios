const fs = require('fs');
const path = require('path');

const mdPath = path.join(__dirname, '../informacoes/listagem_de_beneficiarios/listas de beneficiarios/beneficiarios_consolidado_7_nucleos.md');
const rawContent = fs.readFileSync(mdPath, 'utf8').replace(/\r/g, '');

const nucleosSections = rawContent.split('\n# ').slice(1);
const todosAlunos = [];

for (const sec of nucleosSections) {
  const lines = sec.split('\n');
  const nucleoHeader = lines[0].trim();
  if (nucleoHeader.startsWith('Listagem') || nucleoHeader.startsWith('Resumo')) continue;

  const alunoBlocks = sec.split('\n### ').slice(1);
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

function parseDataNascimento(str) {
  if (!str || str === '—') return null;
  const parts = str.split('/');
  if (parts.length === 3) {
    const dia = parts[0].padStart(2, '0');
    const mes = parts[1].padStart(2, '0');
    const ano = parts[2];
    return `${ano}-${mes}-${dia}`;
  }
  return null;
}

function calculaIdade(isoDate) {
  if (!isoDate) return 12; // default se não tiver data
  const [ano, mes, dia] = isoDate.split('-').map(Number);
  const birth = new Date(ano, mes - 1, dia);
  const ref = new Date(2026, 8, 30);
  return Math.floor((ref - birth) / (365.25 * 24 * 3600 * 1000));
}

const turmaCounts = {};

let s906_sub13_count = 0;

for (const a of todosAlunos) {
  const nucleo = a['Núcleo'];
  const isoNasc = parseDataNascimento(a['Data de nascimento']);
  const idade = calculaIdade(isoNasc);
  let turmaNome = '';

  if (nucleo === 'Núcleo Quadra 1206 Sul') {
    if (idade <= 9) turmaNome = 'Núcleo Quadra 1206 Sul - Futebol de Campo - Sub-9 - Manhã A';
    else if (idade <= 11) turmaNome = 'Núcleo Quadra 1206 Sul - Futebol de Campo - Sub-11 - Manhã A';
    else if (idade <= 13) turmaNome = 'Núcleo Quadra 1206 Sul - Futebol de Campo - Sub-13 - Manhã A';
    else turmaNome = 'Núcleo Quadra 1206 Sul - Futebol de Campo - Sub-15 - Manhã A';
  } else if (nucleo === 'Núcleo Santo Amaro') {
    if (idade <= 9) turmaNome = 'Núcleo Santo Amaro - Futebol de Campo - Sub-9 - Manhã A';
    else if (idade <= 11) turmaNome = 'Núcleo Santo Amaro - Futebol de Campo - Sub-11 - Manhã A';
    else if (idade <= 13) turmaNome = 'Núcleo Santo Amaro - Futebol de Campo - Sub-13 - Manhã A';
    else turmaNome = 'Núcleo Santo Amaro - Futebol de Campo - Sub-15 - Manhã A';
  } else if (nucleo === 'Campo T31 - Taquari') {
    if (idade <= 7) turmaNome = 'Campo T31 - Taquari - Futebol de Campo - Sub-7 - Manhã A';
    else if (idade <= 9) turmaNome = 'Campo T31 - Taquari - Futebol de Campo - Sub-9 - Manhã A';
    else if (idade <= 11) turmaNome = 'Campo T31 - Taquari - Futebol de Campo - Sub-11 - Manhã A';
    else if (idade <= 13) turmaNome = 'Campo T31 - Taquari - Futebol de Campo - Sub-13 - Manhã A';
    else turmaNome = 'Campo T31 - Taquari - Futebol de Campo - Sub-15 - Manhã A';
  } else if (nucleo === 'Núcleo Vila Agrotins') {
    if (idade <= 9) turmaNome = 'Núcleo Vila Agrotins - Futebol de Campo - Sub-9 - Manhã A';
    else if (idade <= 11) turmaNome = 'Núcleo Vila Agrotins - Futebol de Campo - Sub-11 - Manhã A';
    else if (idade <= 13) turmaNome = 'Núcleo Vila Agrotins - Futebol de Campo - Sub-13 - Manhã A';
    else if (idade <= 15) turmaNome = 'Núcleo Vila Agrotins - Futebol de Campo - Sub-15 - Manhã A';
    else turmaNome = 'Núcleo Vila Agrotins - Futebol de Campo - Sub-17 - Manhã A';
  } else if (nucleo === 'Núcleo Quadra 906 Sul') {
    if (idade <= 11) {
      turmaNome = 'Núcleo Quadra 906 Sul - Futebol de Campo - Sub-11 - Tarde A';
    } else {
      s906_sub13_count++;
      if (s906_sub13_count <= 22) {
        turmaNome = 'Núcleo Quadra 906 Sul - Futebol de Campo - Sub-13 - Tarde A';
      } else {
        turmaNome = 'Núcleo Quadra 906 Sul - Futebol de Campo - Sub-13 - Tarde B';
      }
    }
  } else if (nucleo === 'Haras RR') {
    if (idade <= 9) turmaNome = 'Haras RR - Futebol de Campo - Sub-9 - Manhã A';
    else if (idade <= 11) turmaNome = 'Haras RR - Futebol de Campo - Sub-11 - Manhã A';
    else turmaNome = 'Haras RR - Futebol de Campo - Sub-13 - Manhã A';
  } else if (nucleo === 'Complexo ARNO 51') {
    if (idade <= 11) turmaNome = 'Complexo ARNO 51 - Futebol de Campo - Sub-11 - Manhã A';
    else if (idade <= 13) turmaNome = 'Complexo ARNO 51 - Futebol de Campo - Sub-13 - Manhã A';
    else if (idade <= 15) turmaNome = 'Complexo ARNO 51 - Futebol de Campo - Sub-15 - Manhã A';
    else turmaNome = 'Complexo ARNO 51 - Futebol de Campo - Sub-17 - Manhã A';
  }

  turmaCounts[turmaNome] = (turmaCounts[turmaNome] || 0) + 1;
}

console.log('Distribuição por Turma:');
let totalMatriculados = 0;
for (const [turma, qtd] of Object.entries(turmaCounts).sort()) {
  console.log(`- ${turma}: ${qtd} alunos`);
  totalMatriculados += qtd;
}
console.log(`\nTotal Matriculado: ${totalMatriculados} / ${todosAlunos.length}`);
