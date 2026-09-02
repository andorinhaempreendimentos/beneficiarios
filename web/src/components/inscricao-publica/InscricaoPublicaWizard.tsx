"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  MapPin,
  Globe,
  Building,
  CheckCircle2,
  Navigation,
  ArrowLeft,
  CalendarDays,
  Clock,
  Users,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Info,
  Sparkles,
} from "lucide-react";
import type { NucleoApi, AtividadeApi, TurmaApi } from "@/lib/api/services";
import { normalizarNucleoLocalizacao } from "@/lib/location";
import {
  obterGeolocalizacaoNavegador,
  validarConformidadeLocalizacao,
  type GeolocalizacaoConfig,
  type CoordenadasUsuario,
  type ResultadoValidacaoGeo,
} from "@/lib/geolocation";
import { InstrucoesInscricaoBanner } from "./InstrucoesInscricaoBanner";

const ESTADOS_NOMES: Record<string, string> = {
  TO: "Tocantins (TO)",
  PE: "Pernambuco (PE)",
  SP: "São Paulo (SP)",
  RJ: "Rio de Janeiro (RJ)",
  DF: "Distrito Federal (DF)",
  BA: "Bahia (BA)",
  MG: "Minas Gerais (MG)",
};

interface InscricaoPublicaWizardProps {
  nucleos: NucleoApi[];
  atividades: AtividadeApi[];
  turmas: TurmaApi[];
  configGeo?: GeolocalizacaoConfig | null;
}

type TurnoFiltro = "todos" | "manha" | "tarde" | "noite";

const OPCOES_TURNOS: { id: TurnoFiltro; label: string; sub: string; icone: string }[] = [
  { id: "todos", label: "Qualquer Período", sub: "Todos os turnos disponíveis", icone: "🗓️" },
  { id: "manha", label: "Manhã", sub: "Turno matutino (7h às 12h)", icone: "☀️" },
  { id: "tarde", label: "Tarde", sub: "Turno vespertino (13h às 18h)", icone: "⛅" },
  { id: "noite", label: "Noite", sub: "Turno noturno (18h às 22h)", icone: "🌙" },
];

function turmaPertenceAoTurno(t: TurmaApi, turno: TurnoFiltro): boolean {
  if (turno === "todos") return true;
  const nomeLower = (t.nome || "").toLowerCase();
  if (turno === "manha") {
    if (nomeLower.includes("manhã") || nomeLower.includes("manha") || nomeLower.includes("matutino")) return true;
    if (Array.isArray(t.slots) && t.slots.some((s: any) => Number(s.inicio) < 12)) return true;
  }
  if (turno === "tarde") {
    if (nomeLower.includes("tarde") || nomeLower.includes("vespertino")) return true;
    if (Array.isArray(t.slots) && t.slots.some((s: any) => Number(s.inicio) >= 12 && Number(s.inicio) < 18)) return true;
  }
  if (turno === "noite") {
    if (nomeLower.includes("noite") || nomeLower.includes("noturno")) return true;
    if (Array.isArray(t.slots) && t.slots.some((s: any) => Number(s.inicio) >= 18)) return true;
  }
  return false;
}

export function InscricaoPublicaWizard({
  nucleos,
  atividades,
  turmas,
  configGeo,
}: InscricaoPublicaWizardProps) {
  // Etapa atual: 1 = Localização, 2 = Atividade e Horário, 3 = Núcleos
  const [etapa, setEtapa] = useState<1 | 2 | 3>(1);

  // Normalização de núcleos por Estado/Cidade
  const nucleosComEstado = useMemo(() => {
    return nucleos.map(normalizarNucleoLocalizacao);
  }, [nucleos]);

  // Estados disponíveis
  const estadosDisponiveis = useMemo(() => {
    return Array.from(new Set(nucleosComEstado.map((n) => n.estadoUf))).sort();
  }, [nucleosComEstado]);

  const [estadoSelecionado, setEstadoSelecionado] = useState<string>("");
  const [cidadeSelecionada, setCidadeSelecionada] = useState<string>("");

  // Cidades do Estado
  const cidadesDisponiveis = useMemo(() => {
    if (!estadoSelecionado) return [];
    return Array.from(
      new Set(
        nucleosComEstado
          .filter((n) => n.estadoUf === estadoSelecionado)
          .map((n) => n.cidadeNome)
      )
    ).sort();
  }, [nucleosComEstado, estadoSelecionado]);

  // Atividade e Período selecionados
  const [atividadeId, setAtividadeId] = useState<string>("");
  const [turnoFiltro, setTurnoFiltro] = useState<TurnoFiltro>("todos");

  // Estado de geolocalização do usuário
  const [coordsUser, setCoordsUser] = useState<CoordenadasUsuario | null>(null);
  const [geoValidacao, setGeoValidacao] = useState<ResultadoValidacaoGeo | null>(null);
  const [checandoGeo, setChecandoGeo] = useState(false);

  // Solicitar geolocalização se ativa nas configurações
  useEffect(() => {
    if (configGeo?.ativo) {
      setChecandoGeo(true);
      obterGeolocalizacaoNavegador()
        .then((coords) => {
          setCoordsUser(coords);
          if (cidadeSelecionada) {
            const res = validarConformidadeLocalizacao({
              coords,
              config: configGeo,
              cidadeNome: cidadeSelecionada,
              estadoUf: estadoSelecionado,
            });
            setGeoValidacao(res);
          }
        })
        .finally(() => setChecandoGeo(false));
    }
  }, [configGeo, cidadeSelecionada, estadoSelecionado]);

  // Núcleos da cidade selecionada
  const nucleosDaCidade = useMemo(() => {
    if (!estadoSelecionado || !cidadeSelecionada) return [];
    return nucleosComEstado.filter(
      (n) => n.estadoUf === estadoSelecionado && n.cidadeNome === cidadeSelecionada
    );
  }, [nucleosComEstado, estadoSelecionado, cidadeSelecionada]);

  const nucleoIdsDaCidade = useMemo(() => {
    return new Set(nucleosDaCidade.map((n) => n.id));
  }, [nucleosDaCidade]);

  // Turmas disponíveis na cidade selecionada
  const turmasDaCidade = useMemo(() => {
    return turmas.filter((t) => t.nucleoId && nucleoIdsDaCidade.has(t.nucleoId));
  }, [turmas, nucleoIdsDaCidade]);

  // Atividades disponíveis com turmas na cidade
  const atividadesDisponiveisNaCidade = useMemo(() => {
    const atividadeIdsComTurma = new Set(turmasDaCidade.map((t) => t.atividadeId).filter(Boolean));
    return atividades.filter(
      (a) => a.disponivelPreInscricao !== false && atividadeIdsComTurma.has(a.id)
    );
  }, [atividades, turmasDaCidade]);

  // Atividade selecionada (objeto)
  const atividadeSelecionada = useMemo(() => {
    return atividades.find((a) => a.id === atividadeId) || null;
  }, [atividades, atividadeId]);

  // Turmas da atividade selecionada na cidade
  const turmasDaAtividadeNaCidade = useMemo(() => {
    if (!atividadeId) return [];
    return turmasDaCidade.filter((t) => t.atividadeId === atividadeId);
  }, [turmasDaCidade, atividadeId]);

  // Núcleos compatíveis na Etapa 3 (que possuem turmas da atividade + período escolhido)
  const nucleosCompativeis = useMemo(() => {
    if (!atividadeId) return [];

    return nucleosDaCidade
      .map((nucleo) => {
        // Encontrar turmas deste núcleo para esta atividade
        const turmasDoNucleo = turmasDaAtividadeNaCidade.filter((t) => t.nucleoId === nucleo.id);

        // Filtrar exclusivamente pelo período selecionado (Manhã, Tarde, Noite, ou Todos)
        const turmasFiltradas = turmasDoNucleo.filter((t) => turmaPertenceAoTurno(t, turnoFiltro));

        const vagasTotais = turmasFiltradas.reduce(
          (acc, t) => acc + Math.max(0, Number(t.vagasTotais || 0) - Number((t as any).qtdBeneficiarios || 0)),
          0
        );

        return {
          nucleo,
          turmas: turmasFiltradas,
          vagasDisponiveis: vagasTotais,
          primeiraTurmaId: turmasFiltradas[0]?.id || null,
        };
      })
      .filter((item) => item.turmas.length > 0);
  }, [nucleosDaCidade, turmasDaAtividadeNaCidade, atividadeId, turnoFiltro]);

  // Handlers de navegação
  const handleSelecionarEstado = (uf: string) => {
    setEstadoSelecionado(uf);
    setCidadeSelecionada("");
    setAtividadeId("");
  };

  const handleAvancarParaAtividades = () => {
    if (estadoSelecionado && cidadeSelecionada) {
      setEtapa(2);
    }
  };

  const handleAvancarParaNucleos = (atvId: string) => {
    setAtividadeId(atvId);
    setEtapa(3);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Banner Superior de Instruções e Progresso */}
      <InstrucoesInscricaoBanner tipoLink="geral" etapaAtual={etapa} />

      {/* Alerta de Geolocalização (se configurado) */}
      {configGeo?.ativo && (
        <div
          className={`flex items-start gap-3 rounded-2xl border p-4 text-xs shadow-2xs transition-all ${
            geoValidacao?.valido === false
              ? "border-red-300 bg-red-50 text-red-900"
              : geoValidacao?.motivo === "sucesso"
              ? "border-emerald-300 bg-emerald-50 text-emerald-900"
              : "border-sky-200 bg-sky-50/70 text-sky-900"
          }`}
        >
          <div className="mt-0.5">
            {geoValidacao?.valido === false ? (
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            ) : geoValidacao?.motivo === "sucesso" ? (
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <MapPin className="h-4 w-4 text-sky-600 shrink-0" />
            )}
          </div>
          <div className="flex-1 space-y-0.5">
            <span className="font-extrabold uppercase tracking-wider text-[10px]">
              {geoValidacao?.valido === false
                ? "Restrição de Localização"
                : geoValidacao?.motivo === "sucesso"
                ? "Localização Confirmada"
                : "Validação Geográfica Ativa"}
            </span>
            <p className="leading-relaxed">
              {checandoGeo
                ? "Verificando proximidade geográfica com o polo de atendimento..."
                : geoValidacao?.mensagem ||
                  `Inscrições prioritárias para candidatos localizados em ${cidadeSelecionada || "região de atendimento"}.`}
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ETAPA 1: LOCALIZAÇÃO (ESTADO E CIDADE)                                   */}
      {/* ========================================================================= */}
      {etapa === 1 && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-sky-200 bg-linear-to-br from-sky-50/70 via-white to-white p-6 shadow-xs">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 text-white shadow-2xs">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900">
                  Passo 1: Selecione sua Localização
                </h2>
                <p className="text-xs text-zinc-500">
                  Escolha seu Estado e Cidade para visualizar as atividades esportivas disponíveis.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Estado */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-700 flex items-center gap-1">
                  <span>1. Estado (UF)</span>
                  <span className="text-red-500">*</span>
                </label>
                <select
                  value={estadoSelecionado}
                  onChange={(e) => handleSelecionarEstado(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-zinc-900 shadow-2xs transition-colors focus:border-sky-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 cursor-pointer"
                >
                  <option value="">-- Selecione o Estado --</option>
                  {estadosDisponiveis.map((uf) => (
                    <option key={uf} value={uf}>
                      {ESTADOS_NOMES[uf] || `Estado (${uf})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cidade */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-700 flex items-center gap-1">
                  <span>2. Cidade</span>
                  <span className="text-red-500">*</span>
                </label>
                <select
                  value={cidadeSelecionada}
                  onChange={(e) => setCidadeSelecionada(e.target.value)}
                  disabled={!estadoSelecionado || cidadesDisponiveis.length === 0}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-zinc-900 shadow-2xs transition-colors focus:border-sky-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 disabled:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed cursor-pointer"
                >
                  <option value="">
                    {!estadoSelecionado
                      ? "-- Escolha o Estado primeiro --"
                      : "-- Selecione a Cidade --"}
                  </option>
                  {cidadesDisponiveis.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Botão de Avanço */}
            {estadoSelecionado && cidadeSelecionada && (
              <div className="mt-6 flex justify-end border-t border-sky-100 pt-4">
                <button
                  type="button"
                  onClick={handleAvancarParaAtividades}
                  className="flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-sky-700 transition cursor-pointer"
                >
                  <span>Ver Atividades em {cidadeSelecionada}</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {!cidadeSelecionada && (
            <div className="rounded-2xl border border-dashed border-sky-300 bg-sky-50/30 p-10 text-center">
              <Navigation className="mx-auto h-10 w-10 text-sky-500" />
              <h3 className="mt-3 text-base font-bold text-zinc-900">
                Aguardando seleção de Estado e Cidade
              </h3>
              <p className="mt-1 text-sm text-zinc-500 max-w-md mx-auto">
                Por favor, selecione seu <strong>Estado</strong> e sua <strong>Cidade</strong> no painel acima para desbloquear as atividades disponíveis.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ETAPA 2: ESCOLHA DE ATIVIDADE & HORÁRIO                                   */}
      {/* ========================================================================= */}
      {etapa === 2 && (
        <div className="space-y-6">
          {/* Barra de Voltar & Contexto Atual */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-2xs">
            <button
              type="button"
              onClick={() => setEtapa(1)}
              className="flex items-center gap-1.5 text-xs font-bold text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Alterar Localização ({cidadeSelecionada} - {estadoSelecionado})</span>
            </button>
            <span className="text-xs font-semibold text-zinc-500">
              Cidade: <strong className="text-zinc-800">{cidadeSelecionada} · {estadoSelecionado}</strong>
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-zinc-900">
              Passo 2: Escolha a Atividade Desejada
            </h2>
            <p className="text-xs text-zinc-500">
              Selecione a modalidade esportiva para visualizar os horários e núcleos disponíveis em {cidadeSelecionada}.
            </p>
          </div>

          {/* Grid de Atividades */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {atividadesDisponiveisNaCidade.map((atv) => {
              const turmasDestaAtv = turmasDaCidade.filter((t) => t.atividadeId === atv.id);
              const vagasTotais = turmasDestaAtv.reduce(
                (acc, t) => acc + Math.max(0, Number(t.vagasTotais || 0) - Number((t as any).qtdBeneficiarios || 0)),
                0
              );
              const isSelected = atividadeId === atv.id;

              return (
                <div
                  key={atv.id}
                  onClick={() => setAtividadeId(atv.id)}
                  className={`flex flex-col justify-between gap-3 rounded-2xl border p-5 cursor-pointer transition-all ${
                    isSelected
                      ? "border-sky-500 bg-sky-50/70 shadow-md ring-2 ring-sky-500/20"
                      : "border-zinc-200 bg-white hover:border-sky-300 hover:bg-sky-50/30 hover:shadow-xs"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                        Modalidade
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          vagasTotais > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                        }`}
                      >
                        {vagasTotais > 0 ? `${vagasTotais} vagas abertas` : "Sem vagas"}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-zinc-900">{atv.nome}</h3>

                    <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
                      {(atv.idadeMinima != null || atv.idadeMaxima != null) && (
                        <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-medium text-zinc-600">
                          {atv.idadeMinima != null && atv.idadeMaxima != null
                            ? `${atv.idadeMinima} a ${atv.idadeMaxima} anos`
                            : `A partir de ${atv.idadeMinima} anos`}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-zinc-500 font-medium">
                        <Users className="h-3.5 w-3.5 text-zinc-400" />
                        {turmasDestaAtv.length} polo{turmasDestaAtv.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Se selecionada, exibir seletor simplificado de período (Manhã / Tarde / Noite) */}
                  {isSelected && (
                    <div className="mt-2 space-y-3 border-t border-sky-200/80 pt-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-sky-600" />
                          <span>Selecione o Período Desejado:</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {OPCOES_TURNOS.map((opt) => {
                            const ativo = turnoFiltro === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTurnoFiltro(opt.id);
                                }}
                                className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                                  ativo
                                    ? "border-sky-500 bg-sky-100/70 text-sky-900 font-bold shadow-2xs ring-1 ring-sky-500/20"
                                    : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-medium"
                                }`}
                              >
                                <span className="text-sm shrink-0">{opt.icone}</span>
                                <div className="leading-tight">
                                  <span className="text-xs block">{opt.label}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAvancarParaNucleos(atv.id);
                        }}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-sky-700 transition cursor-pointer"
                      >
                        <span>Ver Núcleos com Vagas Disponíveis</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {atividadesDisponiveisNaCidade.length === 0 && (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 p-8 text-center">
              <Building className="mx-auto h-8 w-8 text-zinc-400" />
              <p className="mt-2 text-sm font-medium text-zinc-600">
                Nenhuma atividade com inscrições abertas em {cidadeSelecionada} - {estadoSelecionado}.
              </p>
              <button
                type="button"
                onClick={() => setEtapa(1)}
                className="mt-3 text-xs font-bold text-sky-600 hover:underline cursor-pointer"
              >
                Voltar e escolher outra cidade
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ETAPA 3: ESCOLHA DO NÚCLEO COMPATÍVEL                                    */}
      {/* ========================================================================= */}
      {etapa === 3 && (
        <div className="space-y-6">
          {/* Barra de Retorno e Resumo da Escolha */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-2xs">
            <button
              type="button"
              onClick={() => setEtapa(2)}
              className="flex items-center gap-1.5 text-xs font-bold text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Alterar Atividade e Período</span>
            </button>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-md bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800">
                {atividadeSelecionada?.nome}
              </span>
              {turnoFiltro !== "todos" && (
                <span className="rounded-md bg-sky-100 px-2 py-0.5 font-bold text-sky-800">
                  Período: {turnoFiltro === "manha" ? "Manhã" : turnoFiltro === "tarde" ? "Tarde" : "Noite"}
                </span>
              )}
              <span className="text-zinc-500 font-medium">em {cidadeSelecionada} - {estadoSelecionado}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <Building className="h-5 w-5 text-violet-600" />
              <span>Passo 3: Escolha o Núcleo Mais Próximo</span>
            </h2>
            <p className="text-xs text-zinc-500">
              Estes são os polos que oferecem <strong>{atividadeSelecionada?.nome}</strong> em {cidadeSelecionada}.
            </p>
          </div>

          {/* Lista de Núcleos Filtrados */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {nucleosCompativeis.map(({ nucleo, turmas: turmasDoPolo, vagasDisponiveis, primeiraTurmaId }) => {
              const linkDestino = primeiraTurmaId
                ? `/inscricao/turma/${primeiraTurmaId}`
                : `/inscricao/nucleo/${nucleo.id}`;

              return (
                <Link
                  key={nucleo.id}
                  href={linkDestino}
                  className="group flex flex-col justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-5 transition-all hover:border-violet-400 hover:bg-violet-50/40 hover:shadow-md"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded-md bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-700">
                        Núcleo de Atendimento
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          vagasDisponiveis > 0
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {vagasDisponiveis > 0 ? `${vagasDisponiveis} vagas` : "Esgotado"}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-zinc-900 group-hover:text-violet-900">
                      {nucleo.identificacao}
                    </h3>

                    {nucleo.nomeLocal && (
                      <p className="text-xs font-medium text-zinc-500">({nucleo.nomeLocal})</p>
                    )}

                    <div className="flex items-start gap-1.5 text-xs text-zinc-500">
                      <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0 mt-0.5" />
                      <span>{[nucleo.bairro, nucleo.cidadeNome, nucleo.regiao].filter(Boolean).join(" · ")}</span>
                    </div>

                    {/* Resumo de dias e horários das turmas deste núcleo */}
                    <div className="rounded-xl bg-zinc-50 p-2.5 space-y-1 text-xs text-zinc-600 border border-zinc-100">
                      {turmasDoPolo.map((t) => {
                        const slotStr =
                          Array.isArray(t.slots) && t.slots.length > 0
                            ? t.slots
                                .map((s: any) => `${s.dia ? s.dia + " " : ""}${s.inicio || ""}h-${s.fim || ""}h`)
                                .filter(Boolean)
                                .join(", ")
                            : "";
                        return (
                          <div key={t.id} className="flex items-center gap-2 text-[11px]">
                            <Clock className="h-3 w-3 text-zinc-400 shrink-0" />
                            <span>{t.nome}{slotStr ? ` (${slotStr})` : ""}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-zinc-100 pt-3 text-xs font-bold text-violet-700 group-hover:text-violet-900">
                    <span>Inscrever-se neste Núcleo</span>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>

          {nucleosCompativeis.length === 0 && (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 p-8 text-center space-y-2">
              <Building className="mx-auto h-8 w-8 text-zinc-400" />
              <p className="text-sm font-medium text-zinc-600">
                Nenhum núcleo com vagas abertas para este horário selecionado.
              </p>
              <button
                type="button"
                onClick={() => setEtapa(2)}
                className="text-xs font-bold text-sky-600 hover:underline cursor-pointer"
              >
                Voltar e escolher outro horário ou modalidade
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
