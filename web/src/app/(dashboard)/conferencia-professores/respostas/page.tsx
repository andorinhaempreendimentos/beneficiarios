"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Calendar,
  Clock,
  School,
  AlertCircle,
  Loader2,
  Check,
  Trash2,
  Copy,
  ExternalLink,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  MessageSquare,
} from "lucide-react";

interface RespostaConferencia {
  id: string;
  nucleo_id: string | null;
  nucleo_nome: string;
  professor_id: string | null;
  professor_nome: string;
  modalidade_id: string | null;
  modalidade_nome: string;
  qtd_turmas: number;
  dados_turmas: {
    dias_semana?: string[];
    total_aulas_semana?: number;
    aulas_por_dia?: Record<
      string,
      Array<{
        aula_numero: number;
        horario_inicio: string;
        horario_fim: string;
        idade_minima: number;
        idade_maxima: number;
      }>
    >;
  };
  observacoes: string | null;
  created_at: string;
}

export default function RespostasConferenciaPage() {
  const [respostas, setRespostas] = useState<RespostaConferencia[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);

  // Seleção de itens (IDs)
  const [selecionados, setSelecionados] = useState<string[]>([]);

  // Filtros
  const [busca, setBusca] = useState<string>("");
  const [filtroModalidade, setFiltroModalidade] = useState<string>("todos");

  // Itens expandidos para ver a grade detalhada
  const [expandidos, setExpandidos] = useState<string[]>([]);

  // Estados de ação
  const [apagando, setApagando] = useState<boolean>(false);
  const [copiadoFeedback, setCopiadoFeedback] = useState<string | null>(null);

  // Carregar dados
  const carregarRespostas = async () => {
    try {
      setLoading(true);
      setErro(null);
      const res = await fetch("/api/conferencia-professores/respostas");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao carregar respostas");
      setRespostas(data.respostas || []);
    } catch (err: any) {
      setErro(err.message || "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarRespostas();
  }, []);

  // Modalidades únicas para o filtro
  const modalidadesUnicas = useMemo(() => {
    const mods = new Set<string>();
    respostas.forEach((r) => {
      if (r.modalidade_nome) mods.add(r.modalidade_nome);
    });
    return Array.from(mods);
  }, [respostas]);

  // Lista filtrada
  const respostasFiltradas = useMemo(() => {
    return respostas.filter((item) => {
      const matchBusca =
        item.nucleo_nome.toLowerCase().includes(busca.toLowerCase()) ||
        item.professor_nome.toLowerCase().includes(busca.toLowerCase());
      const matchModalidade =
        filtroModalidade === "todos" || item.modalidade_nome === filtroModalidade;
      return matchBusca && matchModalidade;
    });
  }, [respostas, busca, filtroModalidade]);

  // Toggle seleção individual
  const toggleSelecionar = (id: string) => {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle selecionar todos visíveis
  const toggleSelecionarTodos = () => {
    if (selecionados.length === respostasFiltradas.length && respostasFiltradas.length > 0) {
      setSelecionados([]);
    } else {
      setSelecionados(respostasFiltradas.map((r) => r.id));
    }
  };

  // Toggle expandir card
  const toggleExpandir = (id: string) => {
    setExpandidos((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Formatar texto para cópia de uma ou várias respostas
  const formatarTextoRespostas = (lista: RespostaConferencia[]): string => {
    return lista
      .map((r) => {
        let texto = `*CONFERÊNCIA DE PROFESSORES*\n`;
        texto += `📍 Núcleo: ${r.nucleo_nome}\n`;
        texto += `👤 Professor: ${r.professor_nome}\n`;
        texto += `⚽ Modalidade: ${r.modalidade_nome}\n`;
        texto += `📅 Total de Aulas: ${r.qtd_turmas || 0} na semana\n`;

        const aulasPorDia = r.dados_turmas?.aulas_por_dia;
        if (aulasPorDia && typeof aulasPorDia === "object") {
          texto += `\n*Grade de Aulas:*\n`;
          Object.entries(aulasPorDia).forEach(([dia, aulas]) => {
            texto += `• ${dia}:\n`;
            if (Array.isArray(aulas)) {
              aulas.forEach((a) => {
                texto += `   - ${a.aula_numero}ª Aula: ${a.horario_inicio} às ${a.horario_fim} (${a.idade_minima} a ${a.idade_maxima} anos)\n`;
              });
            }
          });
        }

        if (r.observacoes) {
          texto += `\n📝 Observações: ${r.observacoes}\n`;
        }

        texto += `\nEnviado em: ${new Date(r.created_at).toLocaleString("pt-BR")}\n`;
        return texto;
      })
      .join("\n" + "=".repeat(40) + "\n\n");
  };

  // Copiar selecionadas para a área de transferência
  const copiarSelecionadas = () => {
    const alvos = respostas.filter((r) => selecionados.includes(r.id));
    if (alvos.length === 0) return;

    const textoFormatado = formatarTextoRespostas(alvos);
    navigator.clipboard.writeText(textoFormatado);

    setCopiadoFeedback(`${alvos.length} resposta(s) copiada(s)!`);
    setTimeout(() => setCopiadoFeedback(null), 3000);
  };

  // Copiar resposta individual
  const copiarIndividual = (r: RespostaConferencia) => {
    const textoFormatado = formatarTextoRespostas([r]);
    navigator.clipboard.writeText(textoFormatado);

    setCopiadoFeedback(`Resposta de ${r.nucleo_nome} copiada!`);
    setTimeout(() => setCopiadoFeedback(null), 3000);
  };

  // Apagar respostas (individual ou selecionadas)
  const apagarRespostas = async (idsParaApagar: string[]) => {
    if (idsParaApagar.length === 0) return;

    const confirmou = window.confirm(
      `Deseja realmente apagar ${idsParaApagar.length} resposta(s)?\n\nEssa ação liberará o núcleo novamente no formulário.`
    );
    if (!confirmou) return;

    try {
      setApagando(true);
      const res = await fetch("/api/conferencia-professores/respostas", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: idsParaApagar }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao apagar");

      // Atualiza lista local
      setRespostas((prev) => prev.filter((r) => !idsParaApagar.includes(r.id)));
      setSelecionados((prev) => prev.filter((id) => !idsParaApagar.includes(id)));
    } catch (err: any) {
      alert(`Erro ao excluir: ${err.message}`);
    } finally {
      setApagando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2.5">
            <School className="w-7 h-7 text-sky-600" />
            Conferência de Professores
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Visualize, confira as grades semanais, copie os horários e gerencie as respostas enviadas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={carregarRespostas}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Atualizar</span>
          </button>

          <Link
            href="/conferencia-professores"
            target="_blank"
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <span>Abrir Formulário</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Feedback de Cópia */}
      {copiadoFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-fadeIn shadow-2xs">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{copiadoFeedback}</span>
        </div>
      )}

      {/* Barra de Ações em Lote e Filtros */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 space-y-3 shadow-2xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Busca */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por núcleo ou professor..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-sky-500 bg-zinc-50/50"
            />
          </div>

          {/* Filtro de Modalidade */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-400 shrink-0" />
            <select
              value={filtroModalidade}
              onChange={(e) => setFiltroModalidade(e.target.value)}
              className="h-10 px-3 rounded-xl border border-zinc-200 text-xs font-medium bg-white focus:ring-2 focus:ring-sky-500"
            >
              <option value="todos">Todas as modalidades</option>
              {modalidadesUnicas.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Barra de ações para selecionados */}
        {selecionados.length > 0 && (
          <div className="pt-3 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-2 bg-sky-50/60 p-3 rounded-xl border border-sky-100 animate-fadeIn">
            <span className="text-xs font-extrabold text-sky-900">
              {selecionados.length} resposta(s) selecionada(s)
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copiarSelecionadas}
                className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Selecionadas</span>
              </button>

              <button
                type="button"
                disabled={apagando}
                onClick={() => apagarRespostas(selecionados)}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Apagar Selecionadas</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lista de Respostas */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
          <span className="text-xs font-bold">Carregando respostas da conferência...</span>
        </div>
      ) : erro ? (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{erro}</span>
        </div>
      ) : respostasFiltradas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center text-zinc-500 space-y-2">
          <Calendar className="w-10 h-10 mx-auto text-zinc-300" />
          <h3 className="font-bold text-sm text-zinc-700">Nenhuma resposta encontrada</h3>
          <p className="text-xs text-zinc-400">
            {busca || filtroModalidade !== "todos"
              ? "Tente ajustar os filtros de busca."
              : "Nenhum professor enviou a conferência de turmas ainda."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Cabeçalho da Lista / Checkbox Selecionar Todos */}
          <div className="flex items-center justify-between px-2 text-xs font-bold text-zinc-500">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={
                  selecionados.length === respostasFiltradas.length &&
                  respostasFiltradas.length > 0
                }
                onChange={toggleSelecionarTodos}
                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
              />
              <span>Selecionar todas ({respostasFiltradas.length})</span>
            </label>
            <span>Total: {respostasFiltradas.length} núcleos</span>
          </div>

          {/* Cards das respostas */}
          {respostasFiltradas.map((r) => {
            const isSelected = selecionados.includes(r.id);
            const isExpanded = expandidos.includes(r.id);
            const aulasPorDia = r.dados_turmas?.aulas_por_dia || {};
            const diasSemana = r.dados_turmas?.dias_semana || Object.keys(aulasPorDia);

            return (
              <div
                key={r.id}
                className={`bg-white rounded-2xl border-2 transition-all overflow-hidden ${
                  isSelected
                    ? "border-sky-500 ring-2 ring-sky-100 shadow-sm"
                    : "border-zinc-200/80 hover:border-zinc-300 shadow-2xs"
                }`}
              >
                {/* Linha Principal do Card */}
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelecionar(r.id)}
                      className="w-4 h-4 mt-1 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                    />

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-sm text-zinc-900">{r.nucleo_nome}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-3xs font-extrabold bg-sky-100 text-sky-800">
                          {r.modalidade_nome}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-3xs font-extrabold bg-emerald-100 text-emerald-800">
                          {r.qtd_turmas || 0} aulas na semana
                        </span>
                      </div>

                      <div className="text-xs text-zinc-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>
                          <strong>Professor:</strong> {r.professor_nome}
                        </span>
                        <span className="text-zinc-300">•</span>
                        <span>
                          <strong>Dias:</strong> {diasSemana.join(", ") || "Não informado"}
                        </span>
                        <span className="text-zinc-300">•</span>
                        <span className="text-zinc-400">
                          {new Date(r.created_at).toLocaleString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Botões de Ação na Linha */}
                  <div className="flex items-center gap-1.5 self-end md:self-center">
                    <button
                      type="button"
                      onClick={() => toggleExpandir(r.id)}
                      className="px-3 py-1.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-bold text-xs flex items-center gap-1 transition-all"
                    >
                      <span>{isExpanded ? "Ocultar Grade" : "Ver Grade"}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => copiarIndividual(r)}
                      className="p-2 rounded-xl text-zinc-600 hover:text-sky-600 hover:bg-sky-50 border border-zinc-200 transition-all"
                      title="Copiar texto formatado"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      disabled={apagando}
                      onClick={() => apagarRespostas([r.id])}
                      className="p-2 rounded-xl text-zinc-600 hover:text-rose-600 hover:bg-rose-50 border border-zinc-200 transition-all"
                      title="Excluir resposta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Grade Semanal Expandida */}
                {isExpanded && (
                  <div className="border-t border-zinc-100 bg-zinc-50/50 p-4 space-y-3 animate-fadeIn">
                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-600 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-sky-600" />
                      Grade Semanal das Aulas
                    </h4>

                    {Object.keys(aulasPorDia).length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {Object.entries(aulasPorDia).map(([diaNome, aulas]) => (
                          <div
                            key={diaNome}
                            className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-2xs"
                          >
                            <div className="bg-sky-600 text-white px-3 py-1.5 flex items-center justify-between">
                              <span className="font-extrabold text-xs">{diaNome}</span>
                              <span className="text-3xs bg-sky-700 px-2 py-0.5 rounded-full font-bold">
                                {Array.isArray(aulas) ? aulas.length : 0} aula(s)
                              </span>
                            </div>

                            <div className="p-2 space-y-1.5 divide-y divide-zinc-100">
                              {Array.isArray(aulas) &&
                                aulas.map((a) => (
                                  <div key={a.aula_numero} className="pt-1.5 first:pt-0 space-y-0.5">
                                    <div className="flex items-center justify-between text-2xs">
                                      <span className="font-black text-sky-800 bg-sky-50 px-1 py-0.5 rounded">
                                        {a.aula_numero}ª Aula
                                      </span>
                                      <span className="font-bold text-zinc-900 flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-zinc-400" />
                                        {a.horario_inicio} - {a.horario_fim}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-3xs text-zinc-600 px-0.5">
                                      <span>Idade:</span>
                                      <span className="font-bold text-zinc-800 bg-zinc-100 px-1.5 py-0.5 rounded">
                                        {a.idade_minima} a {a.idade_maxima} anos
                                      </span>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-400 italic">
                        Nenhuma informação detalhada de aulas encontrada no registro.
                      </p>
                    )}

                    {r.observacoes && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Recado do professor:</strong>
                          <p className="text-xs text-amber-800 mt-0.5">{r.observacoes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
