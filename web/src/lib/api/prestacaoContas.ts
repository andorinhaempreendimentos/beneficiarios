import { createServerClient } from '@supabase/ssr';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';
import { objetosApi, type ObjetoApi } from './services';
import { calcularIdade } from '@/lib/utils';

async function getSupabase() {
  if (typeof window === 'undefined') {
    try {
      const cookieStore = await require('next/headers').cookies();
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qrzszjogxrrjqjkoowoi.supabase.co';
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_AoXvaZk10chLPIIwIWIskA_s4z1xCUY';
      return createServerClient<Database>(url, key, {
        cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} },
      });
    } catch {
      return createBrowserClient();
    }
  }
  return createBrowserClient();
}

function createClient() {
  return createBrowserClient();
}

// ── Tipos de Dados da Prestação de Contas ──────────────────────────────────

export interface AlertaProntidao {
  tipo: 'alerta' | 'aviso' | 'info';
  mensagem: string;
  detalhes?: string;
}

export interface IndicadorMetaExecucao {
  meta: string;
  indicador: string;
  unidade: string;
  previsto: number;
  realizado: number;
  percentualExecucao: number;
  situacao: 'Cumprida' | 'Parcial' | 'Pendente';
}

export interface ExecucaoNucleoItem {
  nucleoId: string;
  identificacao: string;
  bairro?: string;
  regiao?: string;
  modalidades: string[];
  professores: string[];
  totalTurmas: number;
  beneficiariosAtendidos: number;
  aulasRealizadas: number;
}

export interface BeneficiarioListaItem {
  id: string;
  nomeCompleto: string;
  dataNascimento?: string;
  idade: number;
  sexo: string;
  nucleoNome: string;
  status: string;
  vulneravel: boolean;
}

export interface DemonstrativoBeneficiarios {
  totalCadastrados: number;
  ativos: number;
  novosNoPeriodo: number;
  desligadosDesistentes: number;
  feminino: number;
  masculino: number;
  outrosGênero: number;
  redePublicaOuVulneravel: number;
  percentualVulnerabilidade: number;
  faixasEtarias: {
    de06a09: number;
    de10a12: number;
    de13a15: number;
    de16a18: number;
    outras: number;
  };
}

export interface FrequenciaNucleoItem {
  nucleoId: string;
  nucleoNome: string;
  beneficiariosAtivos: number;
  presencasRegistradas: number;
  faltasRegistradas: number;
  frequenciaMedia: number; // %
}

export interface AulaRealizadaItem {
  id: string;
  data: string;
  nucleoNome: string;
  modalidade: string;
  turmaNome: string;
  professorNome: string;
  atividadeDescricao: string;
  participantesPresentes: number;
}

export interface VisitaSupervisaoItem {
  id: string;
  data: string;
  nucleoNome: string;
  coordenadorNome: string;
  professorPresente: boolean;
  beneficiariosPresentes: number;
  estruturaAvaliacao?: string;
  materiaisAvaliacao?: string;
  observacoes?: string;
  situacao: 'Regular' | 'Pendente';
  fotosUrls: string[];
}

export interface CargoRHItem {
  cargoNome: string;
  quantidadePrevista: number;
  quantidadeAtiva: number;
  percentualExecucao: number;
}

export interface ProfissionalItem {
  id: string;
  nomeCompleto: string;
  funcao: string;
  nucleoOuAlocacao: string;
  cargaHorariaSemanal?: string;
  situacao: string;
}

export interface MaterialItem {
  id: string;
  nome: string;
  unidadeMedida: string;
  quantidadePrevista: number;
  quantidadeAdquirida: number;
  quantidadeDistribuida: number;
  destinacao: string;
}

export interface FotoComprovacaoItem {
  id: string;
  url: string;
  data: string;
  nucleoNome?: string;
  atividade: string;
  descricao: string;
}

export interface OcorrenciaItem {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string;
  gravidade: string;
  status: string;
  providencias?: string;
}

export interface DadosRelatorioPrestacaoContas {
  objeto: ObjetoApi;
  organizacao?: {
    nome: string;
    cnpj?: string;
    endereco?: string;
    cidade?: string;
    estado?: string;
    nomeResponsavel?: string;
  };
  periodo: {
    dataInicio: string;
    dataFim: string;
    tipoPeriodo: string;
  };
  resumoIndicadores: {
    nucleos: { previsto: number; realizado: number };
    beneficiarios: { previsto: number; realizado: number };
    turmas: { previsto: number; realizado: number };
    professores: { previsto: number; realizado: number };
    aulas: { previsto: number; realizado: number };
    supervisoes: { previsto: number; realizado: number };
  };
  execucaoPorNucleo: ExecucaoNucleoItem[];
  beneficiarios: DemonstrativoBeneficiarios;
  beneficiariosLista: BeneficiarioListaItem[];
  frequencia: {
    porNucleo: FrequenciaNucleoItem[];
    frequenciaMediaGeral: number;
    metaMinima: number;
  };
  atividadesRealizadas: AulaRealizadaItem[];
  supervisoes: VisitaSupervisaoItem[];
  recursosHumanos: {
    cargosComparativo: CargoRHItem[];
    profissionais: ProfissionalItem[];
  };
  materiais: MaterialItem[];
  cumprimentoMetas: IndicadorMetaExecucao[];
  registroFotografico: FotoComprovacaoItem[];
  ocorrencias: OcorrenciaItem[];
}

// ── Motor de Agregação da Prestação de Contas ─────────────────────────────

export const prestacaoContasApi = {
  /**
   * Checagem informativa de prontidão (não-bloqueante)
   */
  async verificarProntidao(objetoId: string, dataInicio: string, dataFim: string): Promise<AlertaProntidao[]> {
    const sb = await getSupabase();
    const alertas: AlertaProntidao[] = [];

    // 1. Verificar aulas sem chamada
    const { data: aulasSemChamada } = await sb
      .from('execucoes_aula')
      .select('id, data, turmas(nome, nucleo_id, nucleos(identificacao)), beneficiario_presencas(id)')
      .gte('data', dataInicio)
      .lte('data', dataFim);

    if (aulasSemChamada) {
      const pendentes = aulasSemChamada.filter((a: any) => !a.beneficiario_presencas || a.beneficiario_presencas.length === 0);
      if (pendentes.length > 0) {
        alertas.push({
          tipo: 'alerta',
          mensagem: `${pendentes.length} aula(s) realizada(s) sem chamada/frequência lançada no período.`,
          detalhes: 'Lançar as presenças das turmas para que a frequência média apurada não fique subestimada.',
        });
      }
    }

    // 2. Verificar supervisões em rascunho
    const { data: supsRascunho } = await sb
      .from('supervisoes')
      .select('id, data_supervisao, nucleos(identificacao)')
      .eq('status', 'rascunho')
      .gte('data_supervisao', dataInicio)
      .lte('data_supervisao', dataFim);

    if (supsRascunho && supsRascunho.length > 0) {
      alertas.push({
        tipo: 'aviso',
        mensagem: `${supsRascunho.length} visita(s) de supervisão ainda em status de "Rascunho".`,
        detalhes: 'Finalize as visitas para que seus pareceres e fotos constem no relatório oficial.',
      });
    }

    // 3. Verificar núcleos sem professor
    const { data: turmasSemProf } = await sb
      .from('turmas')
      .select('id, nome, nucleos(identificacao), turma_responsaveis(id)')
      .is('deleted_at', null);

    if (turmasSemProf) {
      const semProf = turmasSemProf.filter((t: any) => !t.turma_responsaveis || t.turma_responsaveis.length === 0);
      if (semProf.length > 0) {
        alertas.push({
          tipo: 'info',
          mensagem: `${semProf.length} turma(s) sem professor responsável vinculado no sistema.`,
        });
      }
    }

    return alertas;
  },

  /**
   * Compila todos os dados reais do Objeto e da operação no período
   */
  async obterDadosRelatorio(
    objetoId: string,
    dataInicio: string,
    dataFim: string,
    tipoPeriodo: string = 'trimestral'
  ): Promise<DadosRelatorioPrestacaoContas> {
    const sb = await getSupabase();

    // 1. Objeto e Concedente
    const objeto = await objetosApi.get(objetoId);

    // 2. Organização Executora
    const { data: orgData } = await sb
      .from('organizacoes')
      .select('*')
      .eq('objeto_id', objetoId)
      .is('deleted_at', null)
      .limit(1)
      .single();

    // 3. Núcleos do Objeto
    let qNucleos = sb.from('nucleos').select('*, organizacoes!inner(*)').is('deleted_at', null);
    if (orgData?.id) {
      qNucleos = qNucleos.eq('organizacao_id', orgData.id);
    }
    const { data: nucleosRaw } = await qNucleos;
    const nucleos = nucleosRaw ?? [];
    const nucleosIds = nucleos.map((n: any) => n.id);

    // 4. Turmas
    const { data: turmasRaw } = await sb
      .from('turmas')
      .select('*, atividades(*), turma_responsaveis(funcionario_id, funcionarios(*))')
      .in('nucleo_id', nucleosIds.length > 0 ? nucleosIds : ['00000000-0000-0000-0000-000000000000'])
      .is('deleted_at', null);
    const turmas = turmasRaw ?? [];
    const turmasIds = turmas.map((t: any) => t.id);

    // 5. Beneficiários
    const { data: beneficiariosRaw } = await sb
      .from('beneficiarios')
      .select('*, nucleos(identificacao), beneficiario_turmas(*)')
      .in('nucleo_id', nucleosIds.length > 0 ? nucleosIds : ['00000000-0000-0000-0000-000000000000'])
      .is('deleted_at', null);
    const beneficiarios = beneficiariosRaw ?? [];

    // 6. Funcionários / RH
    const { data: funcionariosRaw } = await sb
      .from('funcionarios')
      .select('*, funcionario_jornada(*)')
      .is('deleted_at', null);
    const funcionarios = (funcionariosRaw ?? []).filter((f: any) => {
      if (f.nucleo_id && nucleosIds.includes(f.nucleo_id)) return true;
      return true; // equipe geral
    });

    // 7. Aulas e Presenças
    const { data: aulasRaw } = await sb
      .from('execucoes_aula')
      .select('*, turmas(*, nucleos(*), atividades(*)), funcionarios(*), beneficiario_presencas(*)')
      .in('turma_id', turmasIds.length > 0 ? turmasIds : ['00000000-0000-0000-0000-000000000000'])
      .gte('data', dataInicio)
      .lte('data', dataFim)
      .order('data', { ascending: true });
    const aulas = aulasRaw ?? [];

    // 8. Supervisões e Fotos
    const { data: supervisoesRaw } = await sb
      .from('supervisoes')
      .select('*, nucleos(*), funcionarios(*), supervisoes_fotos(*)')
      .in('nucleo_id', nucleosIds.length > 0 ? nucleosIds : ['00000000-0000-0000-0000-000000000000'])
      .gte('data_supervisao', dataInicio)
      .lte('data_supervisao', dataFim)
      .is('deleted_at', null)
      .order('data_supervisao', { ascending: true });
    const supervisoes = supervisoesRaw ?? [];

    // 9. Atividades Complementares
    const { data: ativCompRaw } = await sb
      .from('atividades_complementares')
      .select('*, nucleos(*), funcionarios(*)')
      .eq('objeto_id', objetoId)
      .gte('data', dataInicio)
      .lte('data', dataFim)
      .is('deleted_at', null)
      .order('data', { ascending: true });
    const atividadesComp = ativCompRaw ?? [];

    // 10. Materiais e Estoque
    const { data: materiaisRaw } = await sb.from('materiais').select('*').is('deleted_at', null);
    const { data: movsRaw } = await sb
      .from('movimentacoes_estoque')
      .select('*')
      .in('nucleo_id', nucleosIds.length > 0 ? nucleosIds : ['00000000-0000-0000-0000-000000000000'])
      .gte('data_movimentacao', dataInicio)
      .lte('data_movimentacao', dataFim);
    const materiais = materiaisRaw ?? [];
    const movs = movsRaw ?? [];

    // 11. Ocorrências (Pendências Gerais)
    const { data: pendenciasRaw } = await sb
      .from('pendencias_gerais')
      .select('*')
      .in('nucleo_id', nucleosIds.length > 0 ? nucleosIds : ['00000000-0000-0000-0000-000000000000'])
      .gte('created_at', dataInicio)
      .lte('created_at', dataFim + 'T23:59:59Z')
      .is('deleted_at', null);
    const pendencias = pendenciasRaw ?? [];

    // ── CÁLCULO E AGREGAÇÃO DOS DADOS ──────────────────────────────────────

    // Demonstrativo Beneficiários
    const totalCadastrados = beneficiarios.length;
    const ativos = beneficiarios.filter((b: any) => b.status === 'ativo').length;
    const novosNoPeriodo = beneficiarios.filter((b: any) => b.data_cadastro >= dataInicio && b.data_cadastro <= dataFim).length;
    const desligadosDesistentes = beneficiarios.filter((b: any) => b.status === 'desistente' || b.status === 'evadido' || b.status === 'inativo').length;
    const feminino = beneficiarios.filter((b: any) => b.sexo === 'F').length;
    const masculino = beneficiarios.filter((b: any) => b.sexo === 'M').length;
    const outrosGênero = beneficiarios.filter((b: any) => b.sexo !== 'F' && b.sexo !== 'M').length;

    // Critério de vulnerabilidade / rede pública
    const vulneraveis = beneficiarios.filter((b: any) => {
      const isRedePublica = b.rede_ensino && b.rede_ensino.toLowerCase().includes('pública');
      const hasNIS = !!b.numero_nis && b.numero_nis.trim() !== '';
      const hasBeneficio = !!b.beneficio_socioassistencial && b.beneficio_socioassistencial.trim() !== '';
      return isRedePublica || hasNIS || hasBeneficio;
    }).length;
    const percentualVulnerabilidade = totalCadastrados > 0 ? Math.round((vulneraveis / totalCadastrados) * 100) : 0;

    // Faixas etárias
    let de06a09 = 0;
    let de10a12 = 0;
    let de13a15 = 0;
    let de16a18 = 0;
    let outrasFaixas = 0;
    for (const b of beneficiarios) {
      const idade = calcularIdade(b.data_nascimento);
      if (idade >= 6 && idade <= 9) de06a09++;
      else if (idade >= 10 && idade <= 12) de10a12++;
      else if (idade >= 13 && idade <= 15) de13a15++;
      else if (idade >= 16 && idade <= 18) de16a18++;
      else outrasFaixas++;
    }

    // Lista individual para Anexo II
    const beneficiariosLista: BeneficiarioListaItem[] = beneficiarios.map((b: any) => {
      const isRedePublica = b.rede_ensino && b.rede_ensino.toLowerCase().includes('pública');
      const hasNIS = !!b.numero_nis && b.numero_nis.trim() !== '';
      const hasBeneficio = !!b.beneficio_socioassistencial && b.beneficio_socioassistencial.trim() !== '';
      return {
        id: b.id,
        nomeCompleto: b.nome_completo,
        dataNascimento: b.data_nascimento ?? undefined,
        idade: calcularIdade(b.data_nascimento),
        sexo: b.sexo || '—',
        nucleoNome: b.nucleos?.identificacao || 'Não vinculado',
        status: b.status === 'ativo' ? 'Ativo' : b.status || 'Pendente',
        vulneravel: isRedePublica || hasNIS || hasBeneficio,
      };
    });

    // Execução por Núcleo
    const execucaoPorNucleo: ExecucaoNucleoItem[] = nucleos.map((n: any) => {
      const turmasDoNucleo = turmas.filter((t: any) => t.nucleo_id === n.id);
      const modalidades = Array.from(new Set(turmasDoNucleo.map((t: any) => t.atividades?.nome).filter(Boolean)));
      const professores = Array.from(
        new Set(
          turmasDoNucleo.flatMap((t: any) =>
            (t.turma_responsaveis ?? []).map((tr: any) => tr.funcionarios?.nome_completo).filter(Boolean)
          )
        )
      );
      const beneficiariosDoNucleo = beneficiarios.filter((b: any) => b.nucleo_id === n.id);
      const aulasDoNucleo = aulas.filter((a: any) => a.turmas?.nucleo_id === n.id && a.status === 'concluida');

      return {
        nucleoId: n.id,
        identificacao: n.identificacao,
        bairro: n.bairro ?? undefined,
        regiao: n.regiao ?? undefined,
        modalidades,
        professores,
        totalTurmas: turmasDoNucleo.length,
        beneficiariosAtendidos: beneficiariosDoNucleo.length,
        aulasRealizadas: aulasDoNucleo.length,
      };
    });

    // Frequência por Núcleo
    let totalPresencasGeral = 0;
    let totalChamadasGeral = 0;
    const frequenciaPorNucleo: FrequenciaNucleoItem[] = nucleos.map((n: any) => {
      const beneficiariosAtivosNucleo = beneficiarios.filter((b: any) => b.nucleo_id === n.id && b.status === 'ativo').length;
      const aulasDoNucleo = aulas.filter((a: any) => a.turmas?.nucleo_id === n.id);

      let presencasNucleo = 0;
      let faltasNucleo = 0;

      for (const aula of aulasDoNucleo) {
        const presencas = (aula as any).beneficiario_presencas ?? [];
        for (const p of presencas) {
          if (p.status === 'presente') presencasNucleo++;
          else faltasNucleo++;
        }
      }

      totalPresencasGeral += presencasNucleo;
      totalChamadasGeral += presencasNucleo + faltasNucleo;

      const totalRegistros = presencasNucleo + faltasNucleo;
      const freqMedia = totalRegistros > 0 ? Math.round((presencasNucleo / totalRegistros) * 100) : 0;

      return {
        nucleoId: n.id,
        nucleoNome: n.identificacao,
        beneficiariosAtivos: beneficiariosAtivosNucleo,
        presencasRegistradas: presencasNucleo,
        faltasRegistradas: faltasNucleo,
        frequenciaMedia: freqMedia,
      };
    });

    const frequenciaMediaGeral =
      totalChamadasGeral > 0 ? Math.round((totalPresencasGeral / totalChamadasGeral) * 100) : 0;

    // Aulas Realizadas (Diário)
    const atividadesRealizadas: AulaRealizadaItem[] = aulas
      .filter((a: any) => a.status === 'concluida')
      .map((a: any) => {
        const presencas = ((a as any).beneficiario_presencas ?? []).filter((p: any) => p.status === 'presente').length;
        return {
          id: a.id,
          data: a.data,
          nucleoNome: a.turmas?.nucleos?.identificacao ?? '',
          modalidade: a.turmas?.atividades?.nome ?? '',
          turmaNome: a.turmas?.nome ?? '',
          professorNome: a.funcionarios?.nome_completo ?? '',
          atividadeDescricao: a.observacoes || '',
          participantesPresentes: presencas,
        };
      });

    // Supervisões
    const visitasSupervisao: VisitaSupervisaoItem[] = supervisoes.map((s: any) => ({
      id: s.id,
      data: s.data_supervisao,
      nucleoNome: s.nucleos?.identificacao ?? '',
      coordenadorNome: s.funcionarios?.nome_completo ?? '',
      professorPresente: s.professor_presente ?? false,
      beneficiariosPresentes: s.beneficiarios_presentes ?? 0,
      estruturaAvaliacao: s.estrutura_avaliacao ?? undefined,
      materiaisAvaliacao: s.materiais_avaliacao ?? undefined,
      observacoes: s.observacoes_gerais ?? undefined,
      situacao: s.estrutura_avaliacao === 'ruim' || s.estrutura_avaliacao === 'critica' ? 'Pendente' : 'Regular',
      fotosUrls: (s.supervisoes_fotos ?? []).map((f: any) => f.url),
    }));

    // Recursos Humanos - Comparativo de Cargos
    const cargosPrevistos = objeto.cargosPrevistos ?? [];
    const cargosComparativo: CargoRHItem[] = cargosPrevistos.map((cp) => {
      const ativosNoCargo = funcionarios.filter(
        (f: any) => f.funcao && f.funcao.toLowerCase().trim() === cp.cargoNome.toLowerCase().trim()
      ).length;
      const pct = cp.quantidadePrevista > 0 ? Math.round((ativosNoCargo / cp.quantidadePrevista) * 100) : 0;
      return {
        cargoNome: cp.cargoNome,
        quantidadePrevista: cp.quantidadePrevista,
        quantidadeAtiva: ativosNoCargo,
        percentualExecucao: pct,
      };
    });

    const profissionais: ProfissionalItem[] = funcionarios.map((f: any) => {
      const nucleo = nucleos.find((n: any) => n.id === f.nucleo_id);
      const jornada = f.funcionario_jornada ?? [];
      const horas = jornada
        .filter((d: any) => d.ativo && d.hora_entrada && d.hora_saida)
        .reduce((acc: number, d: any) => {
          const [hE, mE] = d.hora_entrada.split(':').map(Number);
          const [hS, mS] = d.hora_saida.split(':').map(Number);
          return acc + (hS * 60 + mS - (hE * 60 + mE));
        }, 0);

      return {
        id: f.id,
        nomeCompleto: f.nome_completo,
        funcao: f.funcao ?? '',
        nucleoOuAlocacao: nucleo?.identificacao ?? f.alocado_em ?? '',
        cargaHorariaSemanal: horas > 0 ? `${Math.floor(horas / 60)}h/sem` : '',
        situacao: f.status === 'ativo' ? 'Ativo' : (f.status || ''),
      };
    });

    // Materiais
    const materiaisItens: MaterialItem[] = materiais.map((m: any) => {
      const entradas = movs
        .filter((mov: any) => mov.material_id === m.id && mov.tipo === 'entrada')
        .reduce((acc: number, mov: any) => acc + mov.quantidade, 0);
      const saidas = movs
        .filter((mov: any) => mov.material_id === m.id && (mov.tipo === 'saida' || mov.tipo === 'transferencia'))
        .reduce((acc: number, mov: any) => acc + mov.quantidade, 0);

      return {
        id: m.id,
        nome: m.nome,
        unidadeMedida: m.unidade_medida,
        quantidadePrevista: m.estoque_minimo || 0,
        quantidadeAdquirida: entradas,
        quantidadeDistribuida: saidas,
        destinacao: 'Núcleos Esportivos e Beneficiários',
      };
    });

    // Indicadores e Cumprimento de Metas (Seção 11)
    const aulasRealizadasTotal = atividadesRealizadas.length;
    const eventosRealizados = atividadesComp.filter((a: any) => a.tipo === 'evento_esportivo').length;
    const reunioesRealizadas = atividadesComp.filter((a: any) => a.tipo === 'reuniao_familia').length;

    const calcMeta = (prev: number, real: number, nome: string, unidade: string): IndicadorMetaExecucao => {
      const pct = prev > 0 ? Math.round((real / prev) * 100) : 0;
      return {
        meta: nome,
        indicador: nome,
        unidade,
        previsto: prev,
        realizado: real,
        percentualExecucao: pct,
        situacao: pct >= 100 ? 'Cumprida' : pct > 0 ? 'Parcial' : 'Pendente',
      };
    };

    const metaFreq = Number(objeto.metaFrequenciaMinima || 0);
    const metaVuln = Number(objeto.metaVulnerabilidadeMinima || 0);

    const cumprimentoMetas: IndicadorMetaExecucao[] = [
      calcMeta(objeto.metaNucleos || 0, nucleos.filter((n: any) => n.em_funcionamento).length, 'Núcleos Esportivos em Funcionamento', 'Núcleos'),
      calcMeta(objeto.metaBeneficiarios || 0, totalCadastrados, 'Beneficiários Atendidos / Matriculados', 'Beneficiários'),
      calcMeta(objeto.metaAulasAno || 0, aulasRealizadasTotal, 'Aulas e Atividades Esportivas Realizadas', 'Aulas'),
      {
        meta: 'Frequência Média de Participação',
        indicador: 'Frequência Média Global',
        unidade: '%',
        previsto: metaFreq,
        realizado: frequenciaMediaGeral,
        percentualExecucao: metaFreq > 0 ? Math.round((frequenciaMediaGeral / metaFreq) * 100) : 0,
        situacao: frequenciaMediaGeral === 0 ? 'Pendente' : frequenciaMediaGeral >= metaFreq ? 'Cumprida' : 'Parcial',
      },
      {
        meta: 'Inclusão Social e Vulnerabilidade',
        indicador: 'Beneficiários de Rede Pública / Baixa Renda',
        unidade: '%',
        previsto: metaVuln,
        realizado: percentualVulnerabilidade,
        percentualExecucao: metaVuln > 0 ? Math.round((percentualVulnerabilidade / metaVuln) * 100) : 0,
        situacao: percentualVulnerabilidade === 0 ? 'Pendente' : percentualVulnerabilidade >= metaVuln ? 'Cumprida' : 'Parcial',
      },
      calcMeta(objeto.metaEventosAno || 0, eventosRealizados, 'Eventos Esportivos e Festivais Comunitários', 'Eventos'),
      calcMeta(objeto.metaReunioesAno || 0, reunioesRealizadas, 'Reuniões com Famílias e Responsáveis', 'Reuniões'),
    ];

    // Registro Fotográfico
    const fotos: FotoComprovacaoItem[] = [];
    // Fotos de supervisão
    for (const s of supervisoes) {
      for (const f of s.supervisoes_fotos ?? []) {
        if (f.url) {
          fotos.push({
            id: f.id,
            url: f.url,
            data: s.data_supervisao,
            nucleoNome: s.nucleos?.identificacao,
            atividade: 'Supervisão Técnica e Acompanhamento de Campo',
            descricao: f.legenda || `Visita de supervisão ao Núcleo ${s.nucleos?.identificacao}`,
          });
        }
      }
    }
    // Fotos de atividades complementares
    for (const a of atividadesComp) {
      for (const url of a.fotos_urls ?? []) {
        fotos.push({
          id: Math.random().toString(36),
          url,
          data: a.data,
          nucleoNome: a.nucleos?.identificacao,
          atividade: a.titulo,
          descricao: a.descricao || `Registro de ${a.tipo}: ${a.titulo}`,
        });
      }
    }

    // Ocorrências
    const ocorrencias: OcorrenciaItem[] = pendencias.map((p: any) => ({
      id: p.id,
      tipo: p.tipo,
      titulo: p.titulo,
      descricao: p.descricao,
      gravidade: p.gravidade,
      status: p.status,
      providencias: p.providencias ?? undefined,
    }));

    return {
      objeto,
      organizacao: orgData
        ? {
            nome: orgData.nome,
            cnpj: orgData.cnpj ?? undefined,
            endereco: orgData.endereco ?? undefined,
            cidade: orgData.cidade ?? undefined,
            estado: orgData.estado ?? undefined,
            nomeResponsavel: orgData.nome_responsavel ?? undefined,
          }
        : undefined,
      periodo: {
        dataInicio,
        dataFim,
        tipoPeriodo,
      },
      resumoIndicadores: {
        nucleos: { previsto: objeto.metaNucleos || 0, realizado: nucleos.filter((n: any) => n.em_funcionamento).length },
        beneficiarios: { previsto: objeto.metaBeneficiarios || 0, realizado: totalCadastrados },
        turmas: { previsto: (objeto.metaNucleos || 0) * 4, realizado: turmas.length },
        professores: {
          previsto: cargosPrevistos.find((c) => c.cargoNome.toLowerCase().includes('instrutor') || c.cargoNome.toLowerCase().includes('professor'))?.quantidadePrevista || 0,
          realizado: funcionarios.filter((f: any) => (f.funcao ?? '').toLowerCase().includes('instrutor') || (f.funcao ?? '').toLowerCase().includes('professor')).length,
        },
        aulas: { previsto: objeto.metaAulasAno || 0, realizado: aulasRealizadasTotal },
        supervisoes: { previsto: (objeto.metaNucleos || 0) * 2, realizado: supervisoes.filter((s: any) => s.status === 'finalizada').length },
      },
      execucaoPorNucleo,
      beneficiarios: {
        totalCadastrados,
        ativos,
        novosNoPeriodo,
        desligadosDesistentes,
        feminino,
        masculino,
        outrosGênero,
        redePublicaOuVulneravel: vulneraveis,
        percentualVulnerabilidade,
        faixasEtarias: {
          de06a09,
          de10a12,
          de13a15,
          de16a18,
          outras: outrasFaixas,
        },
      },
      beneficiariosLista,
      frequencia: {
        porNucleo: frequenciaPorNucleo,
        frequenciaMediaGeral,
        metaMinima: Number(objeto.metaFrequenciaMinima || 75),
      },
      atividadesRealizadas,
      supervisoes: visitasSupervisao,
      recursosHumanos: {
        cargosComparativo,
        profissionais,
      },
      materiais: materiaisItens,
      cumprimentoMetas,
      registroFotografico: fotos,
      ocorrencias,
    };
  },

  /**
   * Salva o relatório emitido no banco de dados
   */
  async salvarRelatorioEmitido(dados: {
    objetoId: string;
    dataInicio: string;
    dataFim: string;
    tipoPeriodo: string;
    dadosSnapshot: any;
    pareceres: any;
    signatarios: any;
    emitidoPorId?: string;
  }) {
    const sb = createClient();
    const { data, error } = await sb
      .from('relatorios_prestacao_contas')
      .insert({
        objeto_id: dados.objetoId,
        data_inicio: dados.dataInicio,
        data_fim: dados.dataFim,
        tipo_periodo: dados.tipoPeriodo,
        dados_snapshot: dados.dadosSnapshot,
        pareceres: dados.pareceres,
        signatarios: dados.signatarios,
        emitido_por_id: dados.emitidoPorId || null,
        status: 'emitido',
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Lista o histórico de relatórios emitidos
   */
  async listarHistorico(objetoId?: string) {
    const sb = await getSupabase();
    let q = sb
      .from('relatorios_prestacao_contas')
      .select('*, objetos(nome), usuarios(nome_completo)')
      .order('created_at', { ascending: false });

    if (objetoId) q = q.eq('objeto_id', objetoId);

    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  },

  /**
   * Obtém um relatório salvo por ID
   */
  async obterRelatorioSalvo(id: string) {
    const sb = await getSupabase();
    const { data, error } = await sb
      .from('relatorios_prestacao_contas')
      .select('*, objetos(*), usuarios(nome_completo)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },
};
