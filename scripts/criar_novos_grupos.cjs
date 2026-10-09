const fs = require('fs');
const path = require('path');
const { createClient } = require(path.join(__dirname, '../web/node_modules/@supabase/supabase-js'));

const supabaseUrl = 'https://qrzszjogxrrjqjkoowoi.supabase.co';
const supabaseKey = 'sb_publishable_AoXvaZk10chLPIIwIWIskA_s4z1xCUY';

const supabase = createClient(supabaseUrl, supabaseKey);

// Definição das turmas dos 20 núcleos extraídas das conferências
const nucleosDef = [
  {
    nome: "Campo T31 - Taquari",
    modalidade: "Futebol de Campo",
    turmas: [
      { idt: "A", min: 4, max: 6, vagas: 40 },
      { idt: "B", min: 7, max: 9, vagas: 40 },
      { idt: "C", min: 8, max: 11, vagas: 40 },
      { idt: "D", min: 12, max: 14, vagas: 40 },
      { idt: "E", min: 15, max: 17, vagas: 40 },
    ]
  },
  {
    nome: "Centro Desenv. Futebol Palmas",
    modalidade: "Futebol de Campo",
    turmas: [
      { idt: "A", min: 7, max: 11, vagas: 40 },
      { idt: "B", min: 12, max: 15, vagas: 40 },
      { idt: "C", min: 14, max: 15, vagas: 40 },
      { idt: "D", min: 16, max: 18, vagas: 40 },
      { idt: "E", min: 7, max: 13, vagas: 40 },
    ]
  },
  {
    nome: "Complexo ARNO 51",
    modalidade: "Futebol de Campo",
    turmas: [
      { idt: "A", min: 12, max: 17, vagas: 80 },
    ]
  },
  {
    nome: "Escolinha do Sol Nascente",
    modalidade: "Futebol de Campo",
    turmas: [
      { idt: "A", min: 7, max: 11, vagas: 40 },
      { idt: "B", min: 11, max: 14, vagas: 40 },
      { idt: "C", min: 7, max: 16, vagas: 40 },
    ]
  },
  {
    nome: "Escolinha Esportiva de Taquaruçu",
    modalidade: "Futsal",
    turmas: [
      { idt: "A", min: 5, max: 8, vagas: 35 },
      { idt: "B", min: 8, max: 11, vagas: 35 },
      { idt: "C", min: 11, max: 14, vagas: 35 },
      { idt: "D", min: 14, max: 17, vagas: 35 },
    ]
  },
  {
    nome: "Escolinha Flamboyant",
    modalidade: "Futebol de Campo",
    turmas: [
      { idt: "A", min: 5, max: 8, vagas: 35 },
      { idt: "B", min: 9, max: 12, vagas: 35 },
      { idt: "C", min: 11, max: 14, vagas: 35 },
      { idt: "D", min: 5, max: 15, vagas: 35 },
    ]
  },
  {
    nome: "Haras RR",
    modalidade: "Futebol de Campo",
    turmas: [
      { idt: "A", min: 6, max: 8, vagas: 35 },
      { idt: "B", min: 8, max: 11, vagas: 35 },
      { idt: "C", min: 11, max: 15, vagas: 35 },
    ]
  },
  {
    nome: "Núcleo Aureny III",
    modalidade: "Futebol de Campo",
    turmas: [
      { idt: "A", min: 7, max: 12, vagas: 40 },
      { idt: "B", min: 13, max: 17, vagas: 40 },
      { idt: "C", min: 7, max: 17, vagas: 40 },
    ]
  },
  {
    nome: "Núcleo Buritirana",
    modalidade: "Futebol de Campo",
    turmas: [
      { idt: "A", min: 7, max: 10, vagas: 35 },
      { idt: "B", min: 11, max: 14, vagas: 35 },
      { idt: "C", min: 9, max: 17, vagas: 35 },
      { idt: "D", min: 14, max: 17, vagas: 35 },
      { idt: "E", min: 8, max: 17, vagas: 35 },
    ]
  },
  {
    nome: "Núcleo Capadócia",
    modalidade: "Futebol de Campo",
    turmas: [
      { idt: "A", min: 8, max: 11, vagas: 40 },
    ]
  },
  {
    nome: "Núcleo Lago Norte",
    modalidade: "Futebol de Campo",
    turmas: [
      { idt: "A", min: 7, max: 14, vagas: 40 },
    ]
  },
  {
    nome: "Núcleo Lago Sul",
    modalidade: "Futebol de Campo",
    turmas: [
      { idt: "A", min: 6, max: 8, vagas: 40 },
      { idt: "B", min: 9, max: 12, vagas: 40 },
      { idt: "C", min: 13, max: 16, vagas: 40 },
    ]
  },
  {
    nome: "Núcleo Quadra 1206 Sul",
    modalidade: "Futebol de Campo",
    turmas: [
      { idt: "A", min: 8, max: 11, vagas: 50 },
      { idt: "B", min: 8, max: 16, vagas: 50 },
    ]
  },
  {
    nome: "Núcleo Quadra 1303 Sul",
    modalidade: "Futebol de Campo",
    turmas: [
      { idt: "A", min: 6, max: 8, vagas: 40 },
      { idt: "B", min: 9, max: 12, vagas: 40 },
      { idt: "C", min: 11, max: 13, vagas: 40 },
      { idt: "D", min: 11, max: 15, vagas: 40 },
    ]
  },
  {
    nome: "Núcleo Quadra 607 Norte",
    modalidade: "Futebol de Campo",
    turmas: [
      { idt: "A", min: 5, max: 10, vagas: 40 },
      { idt: "B", min: 10, max: 15, vagas: 40 },
      { idt: "C", min: 6, max: 10, vagas: 40 },
      { idt: "D", min: 10, max: 15, vagas: 40 },
    ]
  },
  {
    nome: "Núcleo Quadra 906 Sul",
    modalidade: "Futsal",
    turmas: [
      { idt: "A", min: 10, max: 12, vagas: 40 },
      { idt: "B", min: 13, max: 14, vagas: 40 },
    ]
  },
  {
    nome: "Núcleo Santo Amaro",
    modalidade: "Futsal",
    turmas: [
      { idt: "A", min: 8, max: 11, vagas: 50 },
    ]
  },
  {
    nome: "Núcleo Sol Nascente I",
    modalidade: "Futebol de Campo",
    turmas: [
      { idt: "A", min: 7, max: 15, vagas: 40 },
      { idt: "B", min: 7, max: 15, vagas: 40 },
    ]
  },
  {
    nome: "Núcleo Vila Agrotins",
    modalidade: "Futebol de Campo",
    turmas: [
      { idt: "A", min: 8, max: 11, vagas: 40 },
      { idt: "B", min: 11, max: 14, vagas: 40 },
      { idt: "C", min: 14, max: 17, vagas: 40 },
      { idt: "D", min: 17, max: 21, vagas: 40 },
    ]
  },
  {
    nome: "Quadra Esportiva Praça 208 Sul",
    modalidade: "Futsal",
    turmas: [
      { idt: "A", min: 6, max: 17, vagas: 35 },
      { idt: "B", min: 6, max: 17, vagas: 35 },
      { idt: "C", min: 17, max: 20, vagas: 35 },
      { idt: "D", min: 6, max: 17, vagas: 35 },
    ]
  }
];

async function main() {
  console.log('Iniciando criação dos grupos...');

  // 1. Buscar núcleos
  const { data: nucleos, error: errN } = await supabase.from('nucleos').select('id, identificacao');
  if (errN) throw errN;
  const nucleoMap = new Map();
  nucleos.forEach(n => nucleoMap.set(n.identificacao, n.id));

  // 2. Buscar atividades e seus dicionários
  const { data: atividades, error: errA } = await supabase.from('atividades').select('id, nome, termo_grupo');
  if (errA) throw errA;
  const ativMap = new Map();
  atividades.forEach(a => ativMap.set(a.nome, a));

  const rowsToInsert = [];

  for (const nDef of nucleosDef) {
    const nucleoId = nucleoMap.get(nDef.nome);
    if (!nucleoId) {
      throw new Error(`Núcleo não encontrado: ${nDef.nome}`);
    }

    const ativ = ativMap.get(nDef.modalidade);
    if (!ativ) {
      throw new Error(`Atividade não encontrada: ${nDef.modalidade}`);
    }

    // Regra do motor: [Nome do Núcleo] - [termo_grupo] [Letra]
    const termoGrupo = ativ.termo_grupo || 'Turma';

    for (const t of nDef.turmas) {
      const nomeOficial = `${nDef.nome} - ${termoGrupo} ${t.idt}`;
      rowsToInsert.push({
        nome: nomeOficial,
        identificador: t.idt,
        nucleo_id: nucleoId,
        atividade_id: ativ.id,
        idade_minima: t.min,
        idade_maxima: t.max,
        vagas_totais: t.vagas,
        tipo: 'regular'
      });
    }
  }

  console.log(`Inserindo ${rowsToInsert.length} turmas...`);
  const { data: inserted, error: errInsert } = await supabase.from('grupos').insert(rowsToInsert).select('id, nome');
  if (errInsert) throw errInsert;

  console.log(`Sucesso! ${inserted.length} grupos criados com o padrão oficial.`);
}

main().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
