const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 1. Mapeamento de núcleos para UUIDs
const NUCLEO_IDS = {
  'Núcleo Quadra 1206 Sul': '9702bfa5-3194-43cb-8b1c-cb47598d64de',
  'Núcleo Santo Amaro': '3c1c5b0c-cbf7-40e6-bb06-0ff39ca0a6f2',
  'Campo T31 - Taquari': '23efd617-da43-4e3c-944e-ad09e2790c2b',
  'Núcleo Vila Agrotins': '39e96034-efcc-46a4-b66b-2a60d27c5293',
  'Núcleo Quadra 906 Sul': '4b2cbfc8-fd3a-41da-a159-6121121f100f',
  'Haras RR': 'ef41c13f-abf7-43d1-8882-1a826ff6311d',
  'Complexo ARNO 51': 'bc9c92d2-e5aa-4be0-9d8e-3f34a489817e'
};

// 2. Mapeamento de turmas para UUIDs
const TURMA_IDS = {
  // Taquari
  'Campo T31 - Taquari - Futebol de Campo - Sub-7 - Manhã A': '3b5fbb0d-6a19-4197-afac-64b542ac163d',
  'Campo T31 - Taquari - Futebol de Campo - Sub-9 - Manhã A': 'a33eba25-3a43-42d7-a83a-2f26662060ff',
  'Campo T31 - Taquari - Futebol de Campo - Sub-11 - Manhã A': '336213fb-a0e5-4c82-a06a-1195d482a961',
  'Campo T31 - Taquari - Futebol de Campo - Sub-13 - Manhã A': 'fe513ac6-2cd5-4d90-8659-cfb1c2c53170',
  'Campo T31 - Taquari - Futebol de Campo - Sub-15 - Manhã A': 'c732ad96-1865-4d40-8bd1-9f12038da238',

  // ARNO 51
  'Complexo ARNO 51 - Futebol de Campo - Sub-11 - Manhã A': '9b7be728-c7b3-405e-93fd-f9fbf718aa39',
  'Complexo ARNO 51 - Futebol de Campo - Sub-13 - Manhã A': '953c2917-9ae9-46e9-be5d-c4e88a0e8d21',
  'Complexo ARNO 51 - Futebol de Campo - Sub-15 - Manhã A': '8a41b156-332f-47c4-91d8-bb47524f8f3a',
  'Complexo ARNO 51 - Futebol de Campo - Sub-17 - Manhã A': '7ef9377c-a378-4c04-8369-f077c2bde68f',

  // Haras RR
  'Haras RR - Futebol de Campo - Sub-9 - Manhã A': '90069e83-612d-4506-9edc-e3d546b8e893',
  'Haras RR - Futebol de Campo - Sub-11 - Manhã A': '813806e8-26a5-4189-a49e-5118e5e0ed65',
  'Haras RR - Futebol de Campo - Sub-13 - Manhã A': '431a6054-f384-44e3-8055-598c445e7682',

  // 1206 Sul
  'Núcleo Quadra 1206 Sul - Futebol de Campo - Sub-9 - Manhã A': 'fa31251e-4491-4265-a4e1-4e2bf8b4a554',
  'Núcleo Quadra 1206 Sul - Futebol de Campo - Sub-11 - Manhã A': '2dc07a7b-5129-489e-9a5d-6b741b426048',
  'Núcleo Quadra 1206 Sul - Futebol de Campo - Sub-13 - Manhã A': 'cf84510c-c4f9-48d0-b849-523405664a82',
  'Núcleo Quadra 1206 Sul - Futebol de Campo - Sub-15 - Manhã A': '5c7cc458-20c5-4aef-9a7d-fe760b715fc2',

  // 906 Sul
  'Núcleo Quadra 906 Sul - Futebol de Campo - Sub-11 - Tarde A': 'f615d27e-466a-4998-9ce8-1c1b818ea97c',
  'Núcleo Quadra 906 Sul - Futebol de Campo - Sub-13 - Tarde A': '74012e1c-f682-4076-a970-27ccbdba41a8',
  'Núcleo Quadra 906 Sul - Futebol de Campo - Sub-13 - Tarde B': '105c9819-8241-4f60-8cb7-eee2aeb0016b',

  // Santo Amaro
  'Núcleo Santo Amaro - Futebol de Campo - Sub-9 - Manhã A': '06dc597e-1f63-4eaf-99ff-a4d689a64ada',
  'Núcleo Santo Amaro - Futebol de Campo - Sub-11 - Manhã A': '4a82b497-fffa-4ff2-9732-3a4bef6b26ac',
  'Núcleo Santo Amaro - Futebol de Campo - Sub-13 - Manhã A': 'fa5fc439-a137-4368-8089-1ecebd02fc7c',
  'Núcleo Santo Amaro - Futebol de Campo - Sub-15 - Manhã A': '86bf4a3b-8283-4078-b9ac-f3e5235d48ce',

  // Vila Agrotins
  'Núcleo Vila Agrotins - Futebol de Campo - Sub-9 - Manhã A': '07bb0156-9cbe-4198-aded-3db0861150c5',
  'Núcleo Vila Agrotins - Futebol de Campo - Sub-11 - Manhã A': 'd38d5684-266c-4767-bbd4-48e8b82f2bf9',
  'Núcleo Vila Agrotins - Futebol de Campo - Sub-13 - Manhã A': 'e29c2a95-53a4-45e3-aca7-338815b1eb50',
  'Núcleo Vila Agrotins - Futebol de Campo - Sub-15 - Manhã A': '619d47dd-5e87-42fe-851f-120c156a382a',
  'Núcleo Vila Agrotins - Futebol de Campo - Sub-17 - Manhã A': '9aa95bba-540f-4f9f-b788-017ce7d1fe75'
};

function sqlEscape(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);
  const s = String(val).replace(/'/g, "''");
  return `'${s}'`;
}

function parseConsolidado() {
  const mdPath = path.join(__dirname, '../informacoes/listagem_de_beneficiarios/listas de beneficiarios/beneficiarios_consolidado_7_nucleos.md');
  const rawContent = fs.readFileSync(mdPath, 'utf8').replace(/\r/g, '');
  const sections = rawContent.split('\n# ').slice(1);
  const alunos = [];

  for (const sec of sections) {
    const lines = sec.split('\n');
    const header = lines[0].trim();
    if (header.startsWith('Listagem') || header.startsWith('Resumo')) continue;

    const blocks = sec.split('\n### ').slice(1);
    for (const b of blocks) {
      const aluno = {};
      const blines = b.split('\n');
      for (const l of blines) {
        if (l.startsWith('- **') && l.includes(':**')) {
          const idx = l.indexOf(':**');
          const key = l.slice(4, idx).trim();
          const val = l.slice(idx + 3).trim();
          aluno[key] = val;
        }
      }
      if (aluno['Nome do aluno']) {
        alunos.push(aluno);
      }
    }
  }
  return alunos;
}

function parseData(str) {
  if (!str || str === '—') return null;
  const datePart = str.split(' ')[0].trim();
  const parts = datePart.split('/');
  if (parts.length === 3) {
    const d = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    let y = parts[2];
    if (y.length === 2) y = '20' + y;
    if (parseInt(y, 10) > 1920 && parseInt(y, 10) <= 2026) {
      return `${y}-${m}-${d}`;
    }
  }
  return null;
}

function calculaIdade(isoDate) {
  if (!isoDate) return 12;
  const [ano, mes, dia] = isoDate.split('-').map(Number);
  const birth = new Date(ano, mes - 1, dia);
  const ref = new Date(2026, 8, 30);
  return Math.floor((ref - birth) / (365.25 * 24 * 3600 * 1000));
}

function sanitizeUniforme(str) {
  if (!str || str === '—') return null;
  const m = str.match(/\b(10|12|14|16|PP|P|M|G|GG)\b/i);
  if (m) return m[1].toUpperCase();
  const cleaned = str.trim().slice(0, 5);
  return cleaned || null;
}

function sanitizeCelular(str, obsParts) {
  if (!str || str === '—') return null;
  if (str.includes('E-mail:')) {
    obsParts.push(`Info telefone original: ${str}`);
  }
  // Extrair números de telefone
  const m = str.match(/(\(?\d{2}\)?\s*\d{4,5}-?\d{4})/);
  if (m) {
    return m[1].slice(0, 20);
  }
  return str.slice(0, 20);
}

function sanitizeTurno(str) {
  if (!str || str === '—') return null;
  if (str.toLowerCase().includes('manhã') || str.toLowerCase().includes('manha')) return 'Manhã';
  if (str.toLowerCase().includes('tarde')) return 'Tarde';
  if (str.toLowerCase().includes('noite')) return 'Noite';
  return str.slice(0, 20);
}

function sanitizeCep(str) {
  if (!str || str === '—') return null;
  const m = str.match(/\d{5}-?\d{3}/);
  if (m) return m[0];
  return str.slice(0, 10);
}

function sanitizeRg(str) {
  if (!str || str === '—') return null;
  return str.slice(0, 20);
}

function sanitizeCpfResp(str) {
  if (!str || str === '—') return null;
  const digits = str.replace(/\D/g, '');
  if (digits.length === 11) return digits;
  return str.slice(0, 14);
}

function main() {
  const alunosRaw = parseConsolidado();
  console.log(`Lidos ${alunosRaw.length} alunos.`);

  // Contagem de CPFs
  const cpfFreq = {};
  for (const a of alunosRaw) {
    const rawCpf = a['CPF do aluno'];
    if (rawCpf && rawCpf !== '—') {
      const clean = rawCpf.replace(/\D/g, '');
      if (clean.length === 11) {
        cpfFreq[clean] = (cpfFreq[clean] || 0) + 1;
      }
    }
  }
  const cpfsDuplicados = new Set(Object.keys(cpfFreq).filter(c => cpfFreq[c] > 1));

  const outputDir = path.join(__dirname, 'sql_batches');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const BATCH_SIZE = 50;
  let batchIndex = 1;
  let s906_sub13_count = 0;

  for (let i = 0; i < alunosRaw.length; i += BATCH_SIZE) {
    const chunk = alunosRaw.slice(i, i + BATCH_SIZE);
    let sql = `-- Lote ${batchIndex} (${i + 1} até ${i + chunk.length})\nBEGIN;\n\n`;

    const benefValues = [];
    const matriculaValues = [];

    for (let j = 0; j < chunk.length; j++) {
      const globalIdx = i + j + 1;
      const a = chunk[j];
      const alunoId = crypto.randomUUID();
      const matricula = `BEN-2026-${String(globalIdx).padStart(4, '0')}`;

      const dataNasc = parseData(a['Data de nascimento']) || '2015-01-01';
      const idade = calculaIdade(dataNasc);

      let sexo = 'M';
      if (a['Sexo'] && a['Sexo'].toLowerCase().startsWith('f')) sexo = 'F';

      let cpfFinal = null;
      const obsParts = [];
      if (a['Observação'] && a['Observação'] !== '—') {
        obsParts.push(a['Observação']);
      }

      const rawCpf = a['CPF do aluno'];
      if (rawCpf && rawCpf !== '—') {
        const clean = rawCpf.replace(/\D/g, '');
        if (clean.length === 11) {
          if (cpfsDuplicados.has(clean)) {
            obsParts.push(`CPF original na ficha: ${rawCpf} (repetido/instrutor)`);
          } else {
            cpfFinal = clean;
          }
        } else {
          obsParts.push(`CPF original na ficha: ${rawCpf}`);
        }
      }

      if (a['Contato de emergência'] && a['Contato de emergência'] !== '—') {
        obsParts.push(`Contato de emergência: ${a['Contato de emergência']}`);
      }

      const celular = sanitizeCelular(a['Telefones'], obsParts);
      const tamanhoUniforme = sanitizeUniforme(a['Tamanho da camisa']);
      const turnoEscolar = sanitizeTurno(a['Turno escolar']);
      const cep = sanitizeCep(a['CEP']);
      const rg = sanitizeRg(a['RG / Certidão']);
      const cpfResp = sanitizeCpfResp(a['CPF do responsável']);

      const nucleoNome = a['Núcleo'];
      const nucleoId = NUCLEO_IDS[nucleoNome] || null;
      const isPcd = a['PCD (Sim/Não)'] === 'Sim';
      const tipoPcd = isPcd && a['Tipo de PCD'] !== '—' ? a['Tipo de PCD'].slice(0, 100) : null;
      const dataCadastro = parseData(a['Data do cadastro']) || '2026-08-01';

      const benefRow = `(${sqlEscape(alunoId)}::uuid, ${sqlEscape(matricula)}, ${sqlEscape(a['Nome do aluno'].slice(0, 300))}, ${sqlEscape(a['Nome do aluno'].slice(0, 300))}, ${sqlEscape(dataNasc)}::date, ${sqlEscape(sexo)}::sexo_beneficiario, ${sqlEscape(dataCadastro)}::date, ${sqlEscape(isPcd)}, ${sqlEscape(tipoPcd)}, ${sqlEscape(nucleoId)}::uuid, 'ativo', 'interna', ${sqlEscape(celular)}, ${sqlEscape(cep)}, ${sqlEscape(a['Endereço'] !== '—' ? a['Endereço'].slice(0, 300) : null)}, ${sqlEscape(a['Bairro'] !== '—' ? a['Bairro'].slice(0, 200) : null)}, 'Palmas', 'TO', ${sqlEscape(cpfFinal)}, ${sqlEscape(rg)}, ${sqlEscape(a['Nome do responsável'] !== '—' ? a['Nome do responsável'].slice(0, 300) : null)}, ${sqlEscape(cpfResp)}, ${sqlEscape(a['Nome da mãe'] !== '—' ? a['Nome da mãe'].slice(0, 150) : null)}, ${sqlEscape(a['Nome do pai'] !== '—' ? a['Nome do pai'].slice(0, 150) : null)}, ${sqlEscape(tamanhoUniforme)}, ${sqlEscape(a['Camisa entregue (Sim/Não)'] === 'Sim')}, ${sqlEscape(a['E-mail'] !== '—' ? a['E-mail'].slice(0, 150) : null)}, ${sqlEscape(a['Tipo de escola (Municipal/Estadual/Particular)'] !== '—' ? a['Tipo de escola (Municipal/Estadual/Particular)'].slice(0, 50) : null)}, ${sqlEscape(a['Nome da escola'] !== '—' ? a['Nome da escola'].slice(0, 150) : null)}, ${sqlEscape(turnoEscolar)}, ${sqlEscape(a['Série'] !== '—' ? a['Série'].slice(0, 50) : null)}, ${sqlEscape(a['Escolaridade'] !== '—' ? a['Escolaridade'].slice(0, 100) : null)}, ${sqlEscape(obsParts.length > 0 ? obsParts.join(' | ') : null)}, NOW(), NOW())`;
      benefValues.push(benefRow);

      // Turma
      let turmaNome = '';
      if (nucleoNome === 'Núcleo Quadra 1206 Sul') {
        if (idade <= 9) turmaNome = 'Núcleo Quadra 1206 Sul - Futebol de Campo - Sub-9 - Manhã A';
        else if (idade <= 11) turmaNome = 'Núcleo Quadra 1206 Sul - Futebol de Campo - Sub-11 - Manhã A';
        else if (idade <= 13) turmaNome = 'Núcleo Quadra 1206 Sul - Futebol de Campo - Sub-13 - Manhã A';
        else turmaNome = 'Núcleo Quadra 1206 Sul - Futebol de Campo - Sub-15 - Manhã A';
      } else if (nucleoNome === 'Núcleo Santo Amaro') {
        if (idade <= 9) turmaNome = 'Núcleo Santo Amaro - Futebol de Campo - Sub-9 - Manhã A';
        else if (idade <= 11) turmaNome = 'Núcleo Santo Amaro - Futebol de Campo - Sub-11 - Manhã A';
        else if (idade <= 13) turmaNome = 'Núcleo Santo Amaro - Futebol de Campo - Sub-13 - Manhã A';
        else turmaNome = 'Núcleo Santo Amaro - Futebol de Campo - Sub-15 - Manhã A';
      } else if (nucleoNome === 'Campo T31 - Taquari') {
        if (idade <= 7) turmaNome = 'Campo T31 - Taquari - Futebol de Campo - Sub-7 - Manhã A';
        else if (idade <= 9) turmaNome = 'Campo T31 - Taquari - Futebol de Campo - Sub-9 - Manhã A';
        else if (idade <= 11) turmaNome = 'Campo T31 - Taquari - Futebol de Campo - Sub-11 - Manhã A';
        else if (idade <= 13) turmaNome = 'Campo T31 - Taquari - Futebol de Campo - Sub-13 - Manhã A';
        else turmaNome = 'Campo T31 - Taquari - Futebol de Campo - Sub-15 - Manhã A';
      } else if (nucleoNome === 'Núcleo Vila Agrotins') {
        if (idade <= 9) turmaNome = 'Núcleo Vila Agrotins - Futebol de Campo - Sub-9 - Manhã A';
        else if (idade <= 11) turmaNome = 'Núcleo Vila Agrotins - Futebol de Campo - Sub-11 - Manhã A';
        else if (idade <= 13) turmaNome = 'Núcleo Vila Agrotins - Futebol de Campo - Sub-13 - Manhã A';
        else if (idade <= 15) turmaNome = 'Núcleo Vila Agrotins - Futebol de Campo - Sub-15 - Manhã A';
        else turmaNome = 'Núcleo Vila Agrotins - Futebol de Campo - Sub-17 - Manhã A';
      } else if (nucleoNome === 'Núcleo Quadra 906 Sul') {
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
      } else if (nucleoNome === 'Haras RR') {
        if (idade <= 9) turmaNome = 'Haras RR - Futebol de Campo - Sub-9 - Manhã A';
        else if (idade <= 11) turmaNome = 'Haras RR - Futebol de Campo - Sub-11 - Manhã A';
        else turmaNome = 'Haras RR - Futebol de Campo - Sub-13 - Manhã A';
      } else if (nucleoNome === 'Complexo ARNO 51') {
        if (idade <= 11) turmaNome = 'Complexo ARNO 51 - Futebol de Campo - Sub-11 - Manhã A';
        else if (idade <= 13) turmaNome = 'Complexo ARNO 51 - Futebol de Campo - Sub-13 - Manhã A';
        else if (idade <= 15) turmaNome = 'Complexo ARNO 51 - Futebol de Campo - Sub-15 - Manhã A';
        else turmaNome = 'Complexo ARNO 51 - Futebol de Campo - Sub-17 - Manhã A';
      }

      const turmaId = TURMA_IDS[turmaNome];
      const matId = crypto.randomUUID();
      const matRow = `(${sqlEscape(matId)}::uuid, ${sqlEscape(alunoId)}::uuid, ${sqlEscape(turmaId)}::uuid, 'ativo'::status_beneficiario_turma, '2026-08-01'::date, NOW(), NOW())`;
      matriculaValues.push(matRow);
    }

    sql += `INSERT INTO beneficiarios (id, matricula, nome_completo, nome_social, data_nascimento, sexo, data_cadastro, pcd, tipo_pcd, nucleo_id, status, tipo_matricula, celular, cep, logradouro, bairro, cidade, estado, cpf, rg, nome_responsavel, cpf_responsavel, nome_mae, nome_pai, tamanho_uniforme, uniforme_entregue, email, rede_ensino, nome_escola, turno_escolar, serie, nivel_escolaridade, observacoes, created_at, updated_at)\nVALUES\n` + benefValues.join(',\n') + ';\n\n';

    sql += `INSERT INTO beneficiario_turmas (id, beneficiario_id, turma_id, status, data_matricula, created_at, updated_at)\nVALUES\n` + matriculaValues.join(',\n') + ';\n\n';

    sql += `COMMIT;\n`;

    const filePath = path.join(outputDir, `batch_${batchIndex}.sql`);
    fs.writeFileSync(filePath, sql, 'utf8');
    console.log(`Gerado lote ${batchIndex}: ${chunk.length} alunos -> ${filePath}`);
    batchIndex++;
  }

  // Lote especial para PAR-Q de todos os beneficiários de uma vez
  const parqSql = `BEGIN;\nINSERT INTO beneficiario_parq (id, beneficiario_id, data_resposta, respostas, created_at, updated_at)\n` +
    `SELECT gen_random_uuid(), b.id, '2026-08-01'::date,\n` +
    `'[{"pergunta":"Algum médico já disse que possui problema de coração e recomendou só praticar atividade física supervisionado?","resposta":"Não"},{"pergunta":"Sente dor no peito quando pratica atividade física?","resposta":"Não"},{"pergunta":"No último mês, sentiu dor no peito quando não estava praticando atividade física?","resposta":"Não"},{"pergunta":"Perde o equilíbrio devido a tontura ou já perdeu a consciência?","resposta":"Não"},{"pergunta":"Tem algum problema ósseo ou articular que poderia ser piorado pela atividade física?","resposta":"Não"},{"pergunta":"Toma atualmente algum medicamento para pressão arterial ou problema de coração?","resposta":"Não"},{"pergunta":"Sabe de outra razão pela qual não deveria praticar atividade física?","resposta":"Não"},{"pergunta":"Tem diabetes controlada com insulina?","resposta":"Não"},{"pergunta":"Tem mais de 65 anos e não está acostumado a praticar atividade física?","resposta":"Não"},{"pergunta":"Está gestante ou suspeita estar gestante?","resposta":"Não"}]'::jsonb,\n` +
    `NOW(), NOW()\n` +
    `FROM beneficiarios b\n` +
    `WHERE NOT EXISTS (SELECT 1 FROM beneficiario_parq p WHERE p.beneficiario_id = b.id);\n` +
    `COMMIT;\n`;

  fs.writeFileSync(path.join(outputDir, 'batch_parq.sql'), parqSql, 'utf8');
  console.log('Gerado lote PAR-Q unificado!');
}

main();
