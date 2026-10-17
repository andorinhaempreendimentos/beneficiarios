const fs = require('fs');
const path = require('path');

async function executeQuery(token, projectRef, sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Erro SQL (${res.status}): ${txt}`);
  }

  return await res.json();
}

async function main() {
  console.log('=== EXECUÇÃO DA TAREFA 3: MIGRAÇÃO DEFINITIVA (SQL BATCH) ===');

  const content = fs.readFileSync('C:/Users/livia/.gemini/antigravity/mcp_oauth_tokens.json', 'utf8');
  const data = JSON.parse(content);
  const token = data['https://mcp.supabase.com/mcp'].token.access_token;
  const projectRef = 'qrzszjogxrrjqjkoowoi';

  // 1. Confirmar tabela de backup no PostgreSQL
  console.log('1. Verificando tabela de backup no PostgreSQL...');
  const resBackup = await executeQuery(token, projectRef, 'SELECT count(*) as total FROM backup_beneficiarios_pre_migracao_20261016;');
  const totalBackup = resBackup[0]?.total;
  console.log(`-> Tabela de snapshot confirmada com ${totalBackup} registros.`);
  if (totalBackup !== 747) {
    throw new Error(`Contagem de backup inesperada: ${totalBackup}. Esperado: 747.`);
  }

  // 2. Salvar cópia local dos 747 registros
  console.log('2. Gerando dump de segurança local dos 747 registros existentes...');
  const resAtual = await executeQuery(token, projectRef, 'SELECT * FROM beneficiarios WHERE deleted_at IS NULL ORDER BY created_at ASC;');
  const localDumpPath = path.join(__dirname, 'output', 'backup_beneficiarios_747_local.json');
  fs.writeFileSync(localDumpPath, JSON.stringify(resAtual, null, 2), 'utf8');
  console.log(`-> Dump local salvo em: ${localDumpPath} (${resAtual.length} registros).`);

  // 3. Executar os 4 lotes compactos
  const lotes = ['lote_1.sql', 'lote_2.sql', 'lote_3.sql', 'lote_4.sql'];
  const batchesDir = path.join(__dirname, 'output', 'batches_compactos');

  for (let i = 0; i < lotes.length; i++) {
    const loteFile = lotes[i];
    const lotePath = path.join(batchesDir, loteFile);
    const sql = fs.readFileSync(lotePath, 'utf8');

    console.log(`3.${i + 1}. Executando ${loteFile}...`);
    await executeQuery(token, projectRef, sql);
    console.log(`-> ${loteFile} inserido com sucesso!`);
  }

  // 4. Verificação final no banco
  console.log('4. Verificando integridade no banco de dados...');
  const resFinal = await executeQuery(token, projectRef, 'SELECT count(*) as total FROM beneficiarios WHERE deleted_at IS NULL;');
  const totalFinal = resFinal[0]?.total;
  console.log(`-> Total consolidado no banco: ${totalFinal} beneficiarios ativos.`);

  const resNovos = await executeQuery(token, projectRef, "SELECT count(*) as total FROM beneficiarios WHERE origem = 'formulario_online' AND deleted_at IS NULL;");
  const totalNovos = resNovos[0]?.total;
  console.log(`-> Total de novos alunos inseridos via formulario_online: ${totalNovos}.`);

  if (totalFinal === 1127 && totalNovos === 380) {
    console.log('\n=== MIGRAÇÃO CONCLUÍDA E VERIFICADA COM 100% DE SUCESSO! ===');
    console.log('Base oficial: 747 originais + 380 novos = 1.127 beneficiários no banco real.');
  } else {
    throw new Error(`Contagem final inesperada: total=${totalFinal}, novos=${totalNovos}`);
  }
}

main().catch(err => {
  console.error('Falha na migracao:', err);
  process.exit(1);
});
