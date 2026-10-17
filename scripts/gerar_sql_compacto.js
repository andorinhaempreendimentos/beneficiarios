const fs = require('fs');
const path = require('path');

const preview = require('./output/preview_migracao.json');
console.log(`Carregados ${preview.length} alunos.`);

function sqlEscape(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);
  const s = String(val).replace(/'/g, "''");
  return `'${s}'`;
}

function formatRowCompact(a) {
  const dataNasc = a.data_nascimento ? `${sqlEscape(a.data_nascimento)}::date` : 'NULL';
  const sexo = a.sexo === 'F' ? "'F'::sexo_beneficiario" : "'M'::sexo_beneficiario";
  const nucleoId = a.nucleo_id ? `${sqlEscape(a.nucleo_id)}::uuid` : 'NULL';

  return `(gen_random_uuid(), ${sqlEscape(a.matricula)}, ${sqlEscape(a.nome_completo)}, ${sqlEscape(a.nome_completo)}, ${dataNasc}, ${sexo}, CURRENT_DATE, FALSE, ${nucleoId}, 'ativo', 'online', 'formulario_online', ${sqlEscape(a.nome_responsavel)}, ${sqlEscape(a.celular_responsavel)}, ${sqlEscape(a.cpf_responsavel)}, ${sqlEscape(a.observacoes)}, NOW(), NOW())`;
}

const BATCH_SIZE = 95; // 4 lotes exatos (95 * 4 = 380)
const outDir = path.join(__dirname, 'output', 'batches_compactos');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

for (let i = 0; i < 4; i++) {
  const chunk = preview.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
  const sql = `INSERT INTO beneficiarios (id, matricula, nome_completo, nome_social, data_nascimento, sexo, data_cadastro, pcd, nucleo_id, status, tipo_matricula, origem, nome_responsavel, celular_responsavel, cpf_responsavel, observacoes, created_at, updated_at) VALUES\n` +
    chunk.map(formatRowCompact).join(',\n') + ';';

  const p = path.join(outDir, `lote_${i + 1}.sql`);
  fs.writeFileSync(p, sql, 'utf8');
  console.log(`Lote ${i + 1} (${chunk.length} registros) -> ${p} (${sql.length} bytes)`);
}
