const fs = require('fs');
const path = require('path');
const { createClient } = require(path.join(__dirname, '../../web/node_modules/@supabase/supabase-js'));

const supabaseUrl = 'https://qrzszjogxrrjqjkoowoi.supabase.co';
const supabaseKey = 'sb_publishable_AoXvaZk10chLPIIwIWIskA_s4z1xCUY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Iniciando exportação...');

  // 1. Matrículas / Vínculos
  let allMatriculas = [];
  let from = 0;
  const step = 500;
  while (true) {
    const { data, error } = await supabase
      .from('backup_beneficiario_grupos')
      .select('*')
      .range(from, from + step - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    allMatriculas = allMatriculas.concat(data);
    if (data.length < step) break;
    from += step;
  }

  // 2. Grupos
  const { data: grupos, error: errG } = await supabase
    .from('backup_grupos_estrutura')
    .select('*');
  if (errG) throw errG;

  // 3. Horários
  const { data: horarios, error: errH } = await supabase
    .from('backup_grupo_horarios')
    .select('*');
  if (errH) throw errH;

  // 4. Responsáveis
  const { data: responsaveis, error: errR } = await supabase
    .from('backup_grupo_responsaveis')
    .select('*');
  if (errR) throw errR;

  const backupData = {
    metadata: {
      data_exportacao: new Date().toISOString(),
      total_matriculas: allMatriculas.length,
      total_grupos: grupos.length,
      total_horarios: horarios.length,
      total_responsaveis: responsaveis.length,
    },
    grupos,
    horarios,
    responsaveis,
    matriculas: allMatriculas,
  };

  const outputPath = path.join(__dirname, 'backup_matriculas_pre_reset.json');
  fs.writeFileSync(outputPath, JSON.stringify(backupData, null, 2), 'utf8');

  console.log(`Sucesso! Exportado para ${outputPath}`);
  console.log(`Matrículas: ${allMatriculas.length}, Grupos: ${grupos.length}`);
}

run().catch((err) => {
  console.error('Erro na exportação:', err);
  process.exit(1);
});
