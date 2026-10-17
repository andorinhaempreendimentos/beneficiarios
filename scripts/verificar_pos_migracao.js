const url = 'https://qrzszjogxrrjqjkoowoi.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyenN6am9neHJyanFqa29vd29pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NDk1OTUsImV4cCI6MjEwMTUyNTU5NX0.8ftSA1_vxOAbUsp32MoGnvd4gU4qNQ73NoqquYTvQZo';
const { createClient } = require('../web/node_modules/@supabase/supabase-js');
const supabase = createClient(url, key);

async function main() {
  console.log('=== VERIFICAÇÃO CRUZADA PÓS-MIGRAÇÃO (TAREFA 5) ===\n');

  // 1. Datalake ao vivo
  console.log('1. Consultando API do Datalake...');
  const res = await fetch('https://beneficiarios-andorinha.vercel.app/api/datalake', {
    headers: { 'x-datalake-senha': 'Datalake123#' }
  });
  const data = await res.json();
  console.log('Resumo Datalake:', data.resumo);

  console.log('\n2. Tabela de Metas dos Núcleos no Datalake:');
  data.nucleosMetas.forEach(n => {
    console.log(`- ${n.nome}: Banco=${n.totalBanco} | Form=${n.totalFormulario} | Total=${n.totalGeral} (${n.percentual}%) [Status: ${n.statusMeta}]`);
  });

  // 3. Consulta da view
  console.log('\n3. Contagem direta na View vw_datalake_beneficiarios:');
  const { data: viewCounts, error: errView } = await supabase
    .from('vw_datalake_beneficiarios')
    .select('origem');
  
  if (errView) throw errView;
  const origens = {};
  viewCounts.forEach(r => origens[r.origem] = (origens[r.origem] || 0) + 1);
  console.log('Distribuição por origem:', origens);
  console.log('Total consolidado na View:', viewCounts.length);
}

main().catch(console.error);
