const fs = require('fs');
const path = require('path');
let createClient;
try {
  createClient = require('@supabase/supabase-js').createClient;
} catch {
  createClient = require('../web/node_modules/@supabase/supabase-js').createClient;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qrzszjogxrrjqjkoowoi.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyenN6am9neHJyanFqa29vd29pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NDk1OTUsImV4cCI6MjEwMTUyNTU5NX0.8ftSA1_vxOAbUsp32MoGnvd4gU4qNQ73NoqquYTvQZo";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function normalizarNome(nome) {
  if (!nome) return '';
  return nome.trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizarData(d) {
  if (!d) return '';
  const s = String(d).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [dia, mes, ano] = s.split('/');
    return `${ano}-${mes}-${dia}`;
  }
  return s;
}

function sanitizeTelefone(tel) {
  if (!tel) return null;
  const digits = String(tel).replace(/\D/g, '');
  if (digits.length >= 10) return digits.slice(0, 20);
  return String(tel).trim().slice(0, 20);
}

function sanitizeCpf(cpf) {
  if (!cpf) return null;
  const digits = String(cpf).replace(/\D/g, '');
  if (digits.length === 11) return digits;
  return String(cpf).trim().slice(0, 14);
}

async function run() {
  console.log('--- INICIANDO SIMULAÇÃO DE MIGRAÇÃO (DRY RUN) ---');

  // 1. Carregando beneficiários oficiais existentes no banco oficial
  console.log('1. Carregando beneficiários oficiais existentes no banco...');
  const { data: todosBanco, error: errBanco } = await supabase
    .from('vw_datalake_beneficiarios')
    .select('id, matricula, nome_completo, data_nascimento, nucleo_id')
    .eq('origem', 'banco_ativo');

  if (errBanco) throw errBanco;
  console.log(`-> ${todosBanco.length} alunos já ativos no banco oficial.`);

  // Mapa de alunos no banco: chave = nome_normalizado + '|' + data_nasc
  const bancoMap = new Map();
  for (const b of todosBanco) {
    const chave = `${normalizarNome(b.nome_completo)}|${normalizarData(b.data_nascimento)}`;
    bancoMap.set(chave, b);
  }

  // 2. Buscar núcleos para validação de nomes e IDs
  const { data: nucleos, error: errNucleos } = await supabase
    .from('nucleos')
    .select('id, identificacao, nome_local')
    .is('deleted_at', null);
  if (errNucleos) throw errNucleos;
  const nucleosMap = new Map(nucleos.map((n) => [n.id, n.identificacao]));

  // 3. Buscar todas as submissões de formulário
  console.log('2. Carregando respostas_conferencia_beneficiarios...');
  const { data: respostas, error: errResp } = await supabase
    .from('respostas_conferencia_beneficiarios')
    .select('*')
    .order('created_at', { ascending: false }); // Do mais recente para o mais antigo

  if (errResp) throw errResp;
  console.log(`-> ${respostas.length} submissões de formulário encontradas.`);

  // 4. Processar cada aluno dos formulários
  const aprovadosParaInsercao = [];
  const descartadosJaNoBanco = [];
  const descartadosDuplicadosForm = [];
  const vistosNoFormulario = new Map();

  let totalAlunosSubmetidos = 0;
  let proxMatriculaNumero = 746; // Começando imediatamente após BEN-2026-0745

  for (const resp of respostas) {
    const nucleoId = resp.nucleo_id;
    const nucleoNome = nucleosMap.get(nucleoId) || resp.nucleo_nome || 'Núcleo Desconhecido';
    const novos = Array.isArray(resp.novos_alunos_cadastrados) ? resp.novos_alunos_cadastrados : [];

    for (const a of novos) {
      if (!a.nomeCompleto || !a.nomeCompleto.trim()) continue;
      totalAlunosSubmetidos++;

      const nomeLimpo = a.nomeCompleto.trim().toUpperCase();
      const nomeNorm = normalizarNome(nomeLimpo);
      const dataNasc = normalizarData(a.dataNascimento);
      const chave = `${nomeNorm}|${dataNasc}`;

      // A) Já existe no banco de dados ativo?
      if (bancoMap.has(chave)) {
        const existente = bancoMap.get(chave);
        descartadosJaNoBanco.push({
          nomeCompleto: nomeLimpo,
          dataNascimento: dataNasc,
          nucleoFormulario: nucleoNome,
          nucleoIdFormulario: nucleoId,
          matriculaExistente: existente.matricula,
          nucleoExistenteId: existente.nucleo_id,
          motivo: `Aluno já matriculado no banco oficial com matrícula ${existente.matricula}`,
        });
        continue;
      }

      // B) Já foi processado em outra submissão do formulário (duplicata interna)?
      if (vistosNoFormulario.has(chave)) {
        const anterior = vistosNoFormulario.get(chave);
        descartadosDuplicadosForm.push({
          nomeCompleto: nomeLimpo,
          dataNascimento: dataNasc,
          nucleo: nucleoNome,
          dataSubmissao: resp.created_at,
          responsavel: a.responsavel?.nomeCompleto || resp.professor_nome,
          motivo: `Submissão repetida da mesma criança no formulário (já aproveitado envio mais recente em ${anterior.submetidoEm})`,
        });
        continue;
      }

      // C) Novo aluno único e higienizado aprovado!
      vistosNoFormulario.set(chave, {
        nome: nomeLimpo,
        submetidoEm: resp.created_at,
      });

      const matriculaFormatada = `BEN-2026-${String(proxMatriculaNumero).padStart(4, '0')}`;
      proxMatriculaNumero++;

      const responsavelNome = a.responsavel?.nomeCompleto?.trim() || (resp.professor_nome?.startsWith('Responsável:') ? resp.professor_nome.replace('Responsável:', '').trim() : null);
      const responsavelWhats = sanitizeTelefone(a.responsavel?.whatsapp);
      const responsavelCpf = sanitizeCpf(a.responsavel?.cpf);

      aprovadosParaInsercao.push({
        matricula: matriculaFormatada,
        nome_completo: nomeLimpo,
        data_nascimento: dataNasc || null,
        sexo: a.sexo === 'F' ? 'F' : 'M',
        nucleo_id: nucleoId,
        nucleo_nome: nucleoNome,
        status: 'ativo',
        tipo_matricula: 'online',
        origem: 'formulario_online',
        nome_responsavel: responsavelNome,
        celular_responsavel: responsavelWhats,
        cpf_responsavel: responsavelCpf,
        observacoes: `Cadastro via formulário online em ${resp.created_at.split('T')[0]}. Turnos/dias: ${JSON.stringify(a.diasParticipacao || [])}`,
        submissao_id: resp.id,
      });
    }
  }

  // 5. Agrupamento por núcleo dos novos aprovados
  const porNucleo = {};
  for (const a of aprovadosParaInsercao) {
    if (!porNucleo[a.nucleo_nome]) porNucleo[a.nucleo_nome] = 0;
    porNucleo[a.nucleo_nome]++;
  }

  // 6. Gravar saídas em diretório dedicado
  const outDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const previewJsonPath = path.join(outDir, 'preview_migracao.json');
  fs.writeFileSync(previewJsonPath, JSON.stringify(aprovadosParaInsercao, null, 2), 'utf8');

  const descartesJsonPath = path.join(outDir, 'relatorio_descartes.json');
  fs.writeFileSync(descartesJsonPath, JSON.stringify({
    totalDescartes: descartadosJaNoBanco.length + descartadosDuplicadosForm.length,
    descartadosJaNoBanco,
    descartadosDuplicadosForm,
  }, null, 2), 'utf8');

  let md = '# Relatório de Simulação da Migração (Dry Run)\n\n';
  md += 'Este relatório apresenta os resultados da simulação sem realizar nenhuma alteração no banco de dados.\n\n';
  md += '## 1. Resumo Quantitativo\n';
  md += `- **Total de submissões brutas de alunos nos formulários:** ${totalAlunosSubmetidos}\n`;
  md += `- **Descartados por já estarem cadastrados no banco oficial:** ${descartadosJaNoBanco.length}\n`;
  md += `- **Descartados por submissões repetidas nos formulários:** ${descartadosDuplicadosForm.length}\n`;
  md += `- **NOVOS ALUNOS ÚNICOS APROVADOS PARA INSERÇÃO:** **${aprovadosParaInsercao.length}**\n\n`;
  md += `> Faixa de matrículas planejada: **BEN-2026-0746** até **BEN-2026-${String(proxMatriculaNumero - 1).padStart(4, '0')}**\n\n`;

  md += '## 2. Distribuição dos Novos Alunos por Núcleo\n\n';
  md += '| Núcleo | Novos Alunos Aprovados |\n';
  md += '|:---|:---:|\n';
  for (const n of Object.keys(porNucleo).sort()) {
    md += `| **${n}** | ${porNucleo[n]} |\n`;
  }
  md += `| **TOTAL GERAL** | **${aprovadosParaInsercao.length}** |\n\n`;

  md += '## 3. Impacto Projetado no Banco Real\n\n';
  md += `- Base oficial atual: **${todosBanco.length} alunos**\n`;
  md += `- Novos cadastros a inserir: **+${aprovadosParaInsercao.length} alunos**\n`;
  md += `- Nova base consolidada no banco real: **${todosBanco.length + aprovadosParaInsercao.length} alunos**\n`;

  const relatorioMdPath = path.join(outDir, 'relatorio_simulacao.md');
  fs.writeFileSync(relatorioMdPath, md, 'utf8');

  // Copiar também para o diretório de artifacts para visualização fácil
  const artifactRelatorioPath = 'C:/Users/livia/.gemini/antigravity/brain/dcaced52-a9f2-4a19-bcc0-9a36014c9760/relatorio_simulacao_migracao.md';
  fs.writeFileSync(artifactRelatorioPath, md, 'utf8');

  console.log('--- SIMULAÇÃO CONCLUÍDA COM SUCESSO ---');
  console.log(`Total Bruto: ${totalAlunosSubmetidos}`);
  console.log(`Descartados (Já no Banco): ${descartadosJaNoBanco.length}`);
  console.log(`Descartados (Duplicatas Form): ${descartadosDuplicadosForm.length}`);
  console.log(`Novos Alunos Únicos: ${aprovadosParaInsercao.length}`);
  console.log(`Arquivos gerados em:\n- ${previewJsonPath}\n- ${descartesJsonPath}\n- ${artifactRelatorioPath}`);
}

run().catch((err) => {
  console.error('Erro na simulação:', err);
  process.exit(1);
});
