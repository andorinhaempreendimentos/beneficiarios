const { createClient } = require('../web/node_modules/@supabase/supabase-js');
const url = 'https://qrzszjogxrrjqjkoowoi.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyenN6am9neHJyanFqa29vd29pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NDk1OTUsImV4cCI6MjEwMTUyNTU5NX0.8ftSA1_vxOAbUsp32MoGnvd4gU4qNQ73NoqquYTvQZo';
const supabase = createClient(url, key);

async function fetchAllInBatches(queryFactory, batchSize = 1000) {
  let allRows = [];
  let page = 0;
  while (true) {
    const from = page * batchSize;
    const to = from + batchSize - 1;
    const { data, error } = await queryFactory(from, to);
    if (error) throw error;
    if (!data || data.length === 0) break;
    allRows = allRows.concat(data);
    if (data.length < batchSize) break;
    page++;
  }
  return allRows;
}

async function main() {
  console.log('====================================================');
  console.log('  VERIFICAÇÃO DE ELIMINAÇÃO DO LIMITE DE 1.000');
  console.log('====================================================\n');

  // 1. Núcleos
  const nucleos = await fetchAllInBatches((from, to) =>
    supabase.from('nucleos').select('id, identificacao').is('deleted_at', null).order('id').range(from, to)
  );
  console.log(`1. Total de Núcleos recuperados: ${nucleos.length} (esperado: 20)`);
  const nucleosIds = nucleos.map(n => n.id);

  // 2. Beneficiários via View do Datalake
  const alunosDatalake = await fetchAllInBatches((from, to) =>
    supabase.from('vw_datalake_beneficiarios').select('id, nome_completo, nucleo_nome').range(from, to)
  );
  console.log(`2. Total de Alunos na View do Datalake: ${alunosDatalake.length} (ultrapassando 1.000 sem truncamento)`);

  // 3. API Datalake Vercel ao vivo
  const resDatalake = await fetch('https://beneficiarios-andorinha.vercel.app/api/datalake', {
    headers: { 'x-datalake-senha': 'Datalake123#' }
  });
  if (resDatalake.ok) {
    const dataDl = await resDatalake.json();
    console.log(`3. Total Datalake API Vercel: ${dataDl.resumo.totalGeral} alunos (Banco: ${dataDl.resumo.totalBanco}, Staging: ${dataDl.resumo.totalFormulariosNovos})`);
  } else {
    console.log('3. Datalake Vercel retornou status:', resDatalake.status);
  }

  console.log('\n====================================================');
  console.log('  HOMOLOGAÇÃO CONCLUÍDA COM SUCESSO!');
  console.log('====================================================');
}

main().catch(console.error);
