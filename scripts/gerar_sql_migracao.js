const fs = require('fs');
const path = require('path');

const preview = require('./output/preview_migracao.json');
console.log(`Carregados ${preview.length} alunos do preview.`);

function sqlEscape(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);
  const s = String(val).replace(/'/g, "''");
  return `'${s}'`;
}

function formatRow(a) {
  const dataNasc = a.data_nascimento ? `${sqlEscape(a.data_nascimento)}::date` : 'NULL';
  const sexo = a.sexo === 'F' ? "'F'::sexo_beneficiario" : "'M'::sexo_beneficiario";
  const nucleoId = a.nucleo_id ? `${sqlEscape(a.nucleo_id)}::uuid` : 'NULL';

  return `  (
    gen_random_uuid(),
    ${sqlEscape(a.matricula)},
    ${sqlEscape(a.nome_completo)},
    ${sqlEscape(a.nome_completo)},
    ${dataNasc},
    ${sexo},
    CURRENT_DATE,
    FALSE,
    ${nucleoId},
    'ativo',
    'online',
    'formulario_online',
    ${sqlEscape(a.nome_responsavel)},
    ${sqlEscape(a.celular_responsavel)},
    ${sqlEscape(a.cpf_responsavel)},
    ${sqlEscape(a.observacoes)},
    NOW(),
    NOW()
  )`;
}

const BATCH_SIZE = 50;
const batchesDir = path.join(__dirname, 'output', 'batches');
if (!fs.existsSync(batchesDir)) fs.mkdirSync(batchesDir, { recursive: true });

let batchIndex = 1;
const batchFiles = [];

for (let i = 0; i < preview.length; i += BATCH_SIZE) {
  const chunk = preview.slice(i, i + BATCH_SIZE);
  let sql = `-- LOTE ${batchIndex} (${i + 1} a ${i + chunk.length} de ${preview.length})\nBEGIN;\n\n`;
  sql += `INSERT INTO beneficiarios (
  id,
  matricula,
  nome_completo,
  nome_social,
  data_nascimento,
  sexo,
  data_cadastro,
  pcd,
  nucleo_id,
  status,
  tipo_matricula,
  origem,
  nome_responsavel,
  celular_responsavel,
  cpf_responsavel,
  observacoes,
  created_at,
  updated_at
) VALUES\n`;

  sql += chunk.map(formatRow).join(',\n') + ';\n\nCOMMIT;\n';

  const bPath = path.join(batchesDir, `lote_${batchIndex}.sql`);
  fs.writeFileSync(bPath, sql, 'utf8');
  batchFiles.push(bPath);
  console.log(`Lote ${batchIndex}: ${chunk.length} alunos -> ${bPath}`);
  batchIndex++;
}

console.log(`\nTodos os ${batchFiles.length} lotes gerados com sucesso!`);
