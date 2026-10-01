const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require(path.join(__dirname, '../web/node_modules/@supabase/supabase-js'));

// 1. Carregar variáveis de ambiente
function loadEnv() {
  const envPath = path.join(__dirname, '../.env');
  const webEnvPath = path.join(__dirname, '../web/.env.local');
  const filePath = fs.existsSync(envPath) ? envPath : webEnvPath;
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
      env[key] = val;
    }
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

// 2. Parser do arquivo Markdown consolidado
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
  // Se contiver hora ex.: 13/11/2025 - 22:04h
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

async function run() {
  console.log('1. Lendo dados do arquivo consolidado...');
  const alunosRaw = parseConsolidado();
  console.log(`Total de alunos no arquivo consolidado: ${alunosRaw.length}`);

  if (alunosRaw.length !== 564) {
    console.error(`ERRO: Esperado 564 alunos, encontrado ${alunosRaw.length}`);
    process.exit(1);
  }

  // 2. Análise de CPFs duplicados
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
  console.log(`CPFs distintos repetidos (instrutor/placeholder): ${cpfsDuplicados.size}`);

  // 3. Buscar turmas e núcleos do banco de dados
  console.log('\n2. Buscando turmas e núcleos no banco de dados...');
  const { data: nucleosDb, error: errN } = await supabase.from('nucleos').select('id, identificacao');
  if (errN) throw errN;
  const nucleoMap = new Map(nucleosDb.map(n => [n.identificacao, n.id]));

  const { data: turmasDb, error: errT } = await supabase
    .from('turmas')
    .select('id, nome, nucleo_id, faixa_etaria_id, tipo')
    .eq('tipo', 'regular')
    .is('deleted_at', null);
  if (errT) throw errT;
  const turmaMap = new Map(turmasDb.map(t => [t.nome, t.id]));

  console.log(`Núcleos encontrados: ${nucleosDb.length}`);
  console.log(`Turmas regulares encontradas: ${turmasDb.length}`);

  // 4. Preparar registros para inserção
  const beneficiariosInsert = [];
  const parqInsert = [];
  const matriculasInsert = [];

  let s906_sub13_count = 0;

  for (let i = 0; i < alunosRaw.length; i++) {
    const a = alunosRaw[i];
    const alunoId = crypto.randomUUID();
    const matricula = `BEN-2026-${String(i + 1).padStart(4, '0')}`;

    // Data de nascimento
    const dataNasc = parseData(a['Data de nascimento']) || '2015-01-01';
    const idade = calculaIdade(dataNasc);

    // Sexo
    let sexo = 'M';
    if (a['Sexo'] && a['Sexo'].toLowerCase().startsWith('f')) sexo = 'F';

    // CPF e observações
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

    // Núcleo
    const nucleoNome = a['Núcleo'];
    const nucleoId = nucleoMap.get(nucleoNome) || null;

    // PCD
    const isPcd = a['PCD (Sim/Não)'] === 'Sim';
    const tipoPcd = isPcd && a['Tipo de PCD'] !== '—' ? a['Tipo de PCD'] : null;

    // Data cadastro
    const dataCadastro = parseData(a['Data do cadastro']) || '2026-08-01';

    beneficiariosInsert.push({
      id: alunoId,
      matricula,
      nome_completo: a['Nome do aluno'],
      nome_social: a['Nome do aluno'],
      data_nascimento: dataNasc,
      sexo,
      data_cadastro: dataCadastro,
      pcd: isPcd,
      tipo_pcd: tipoPcd,
      nucleo_id: nucleoId,
      status: 'ativo',
      tipo_matricula: 'interna',
      celular: a['Telefones'] !== '—' ? a['Telefones'] : null,
      cep: a['CEP'] !== '—' ? a['CEP'] : null,
      logradouro: a['Endereço'] !== '—' ? a['Endereço'] : null,
      bairro: a['Bairro'] !== '—' ? a['Bairro'] : null,
      cidade: a['Cidade'] !== '—' ? a['Cidade'] : 'Palmas',
      estado: a['Estado (UF)'] !== '—' ? a['Estado (UF)'] : 'TO',
      cpf: cpfFinal,
      rg: a['RG / Certidão'] !== '—' ? a['RG / Certidão'] : null,
      nome_responsavel: a['Nome do responsável'] !== '—' ? a['Nome do responsável'] : null,
      cpf_responsavel: a['CPF do responsável'] !== '—' ? a['CPF do responsável'] : null,
      nome_mae: a['Nome da mãe'] !== '—' ? a['Nome da mãe'] : null,
      nome_pai: a['Nome do pai'] !== '—' ? a['Nome do pai'] : null,
      tamanho_uniforme: a['Tamanho da camisa'] !== '—' ? a['Tamanho da camisa'] : null,
      uniforme_entregue: a['Camisa entregue (Sim/Não)'] === 'Sim',
      email: a['E-mail'] !== '—' ? a['E-mail'] : null,
      rede_ensino: a['Tipo de escola (Municipal/Estadual/Particular)'] !== '—' ? a['Tipo de escola (Municipal/Estadual/Particular)'] : null,
      nome_escola: a['Nome da escola'] !== '—' ? a['Nome da escola'] : null,
      turno_escolar: a['Turno escolar'] !== '—' ? a['Turno escolar'] : null,
      serie: a['Série'] !== '—' ? a['Série'] : null,
      nivel_escolaridade: a['Escolaridade'] !== '—' ? a['Escolaridade'] : null,
      observacoes: obsParts.length > 0 ? obsParts.join(' | ') : null
    });

    // PAR-Q padrão
    parqInsert.push({
      id: crypto.randomUUID(),
      beneficiario_id: alunoId,
      data_resposta: '2026-08-01',
      respostas: [
        { pergunta: 'Algum médico já disse que possui problema de coração e recomendou só praticar atividade física supervisionado?', resposta: 'Não' },
        { pergunta: 'Sente dor no peito quando pratica atividade física?', resposta: 'Não' },
        { pergunta: 'No último mês, sentiu dor no peito quando não estava praticando atividade física?', resposta: 'Não' },
        { pergunta: 'Perde o equilíbrio devido a tontura ou já perdeu a consciência?', resposta: 'Não' },
        { pergunta: 'Tem algum problema ósseo ou articular que poderia ser piorado pela atividade física?', resposta: 'Não' },
        { pergunta: 'Toma atualmente algum medicamento para pressão arterial ou problema de coração?', resposta: 'Não' },
        { pergunta: 'Sabe de outra razão pela qual não deveria praticar atividade física?', resposta: 'Não' },
        { pergunta: 'Tem diabetes controlada com insulina?', resposta: 'Não' },
        { pergunta: 'Tem mais de 65 anos e não está acostumado a praticar atividade física?', resposta: 'Não' },
        { pergunta: 'Está gestante ou suspeita estar gestante?', resposta: 'Não' }
      ]
    });

    // Enturmação
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

    const turmaId = turmaMap.get(turmaNome);
    if (!turmaId) {
      console.error(`Turma não encontrada para nome: "${turmaNome}" (aluno: ${a['Nome do aluno']}, núcleo: ${nucleoNome})`);
    } else {
      matriculasInsert.push({
        id: crypto.randomUUID(),
        beneficiario_id: alunoId,
        turma_id: turmaId,
        status: 'ativo',
        data_matricula: '2026-08-01'
      });
    }
  }

  console.log(`\nRegistros preparados:`);
  console.log(`- Beneficiários: ${beneficiariosInsert.length}`);
  console.log(`- Fichas PAR-Q: ${parqInsert.length}`);
  console.log(`- Matrículas em turmas: ${matriculasInsert.length}`);

  // 5. Inserir em lotes no Supabase
  const CHUNK_SIZE = 50;

  console.log('\n3. Inserindo beneficiários no banco...');
  for (let i = 0; i < beneficiariosInsert.length; i += CHUNK_SIZE) {
    const chunk = beneficiariosInsert.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase.from('beneficiarios').insert(chunk);
    if (error) {
      console.error(`Erro inserindo lote beneficiarios ${i} a ${i + chunk.length}:`, error);
      throw error;
    }
    process.stdout.write(`Inseridos ${Math.min(i + CHUNK_SIZE, beneficiariosInsert.length)} / ${beneficiariosInsert.length}\r`);
  }
  console.log('\nBeneficiários inseridos com sucesso!');

  console.log('\n4. Inserindo PAR-Q no banco...');
  for (let i = 0; i < parqInsert.length; i += CHUNK_SIZE) {
    const chunk = parqInsert.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase.from('beneficiario_parq').insert(chunk);
    if (error) {
      console.error(`Erro inserindo lote parq ${i} a ${i + chunk.length}:`, error);
      throw error;
    }
    process.stdout.write(`Inseridos ${Math.min(i + CHUNK_SIZE, parqInsert.length)} / ${parqInsert.length}\r`);
  }
  console.log('\nPAR-Q inseridos com sucesso!');

  console.log('\n5. Inserindo matrículas nas turmas no banco...');
  for (let i = 0; i < matriculasInsert.length; i += CHUNK_SIZE) {
    const chunk = matriculasInsert.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase.from('beneficiario_turmas').insert(chunk);
    if (error) {
      console.error(`Erro inserindo lote matriculas ${i} a ${i + chunk.length}:`, error);
      throw error;
    }
    process.stdout.write(`Inseridos ${Math.min(i + CHUNK_SIZE, matriculasInsert.length)} / ${matriculasInsert.length}\r`);
  }
  console.log('\nMatrículas inseridas com sucesso!');

  console.log('\n=========================================');
  console.log('IMPORTAÇÃO E MATRÍCULAS CONCLUÍDAS COM SUCESSO!');
  console.log('=========================================');
}

run().catch(err => {
  console.error('\nFALHA NO PROCESSO:', err);
  process.exit(1);
});
