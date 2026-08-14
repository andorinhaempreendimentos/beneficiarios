"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Calendar,
  AlertTriangle,
  FileText,
  Search,
  Eye,
  X,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  Check,
  Building2,
  Image as ImageIcon,
  Layers,
} from "lucide-react";
import { Badge, Button, Card, CardBody, CardHeader, Input, StatCard } from "@/components/ui";
import { useToast } from "@/components/providers/ToastProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  execucoesAulaApi,
  type NucleoApi,
  type TurmaApi,
  type FuncionarioApi,
} from "@/lib/api/services";
import type { ExecucaoAulaApi } from "@/lib/types/execucaoAula";
import { formatarData } from "@/lib/utils";

interface AprovacaoPendenciasManagerProps {
  nucleo: NucleoApi;
  pendenciasIniciais: ExecucaoAulaApi[];
  turmas: TurmaApi[];
  funcionarios: FuncionarioApi[];
}

function formatStorageUrl(pathOrUrl?: string): string {
  if (!pathOrUrl) return "";
  if (
    pathOrUrl.startsWith("http://") ||
    pathOrUrl.startsWith("https://") ||
    pathOrUrl.startsWith("data:") ||
    pathOrUrl.startsWith("blob:")
  ) {
    return pathOrUrl;
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return `${supabaseUrl}/storage/v1/object/public/comprovacoes/${pathOrUrl}`;
}

export function AprovacaoPendenciasManager({
  nucleo,
  pendenciasIniciais,
  turmas,
  funcionarios,
}: AprovacaoPendenciasManagerProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const [pendencias, setPendencias] = useState<ExecucaoAulaApi[]>(pendenciasIniciais);
  const [aprovadasCount, setAprovadasCount] = useState(0);
  const [rejeitadasCount, setRejeitadasCount] = useState(0);
  const [busca, setBusca] = useState("");
  const [processandoId, setProcessandoId] = useState<string | null>(null);

  // Modais
  const [fotoModalUrl, setFotoModalUrl] = useState<string | null>(null);
  const [fotoModalTitulo, setFotoModalTitulo] = useState<string>("");
  const [rejeicaoModalItem, setRejeicaoModalItem] = useState<ExecucaoAulaApi | null>(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState("");

  const turmasMap = useMemo(() => new Map(turmas.map((t) => [t.id, t])), [turmas]);
  const funcionariosMap = useMemo(() => new Map(funcionarios.map((f) => [f.id, f])), [funcionarios]);

  function getTurmaNome(turmaId: string): string {
    const turma = turmasMap.get(turmaId);
    if (turma?.nome) return turma.nome;
    return `Turma #${turmaId.slice(0, 8)}`;
  }

  function getProfessorNome(turmaId: string, professorId?: string): string {
    if (professorId) {
      const func = funcionariosMap.get(professorId);
      if (func?.nomeCompleto) return func.nomeCompleto;
    }
    const turma = turmasMap.get(turmaId);
    if (turma?.responsaveisNomes && turma.responsaveisNomes.length > 0) {
      return turma.responsaveisNomes.join(", ");
    }
    return professorId ? `Professor #${professorId.slice(0, 8)}` : "Não identificado";
  }

  // Filtragem
  const pendenciasFiltradas = useMemo(() => {
    if (!busca.trim()) return pendencias;
    const termo = busca.toLowerCase();

    return pendencias.filter((item) => {
      const turmaNome = getTurmaNome(item.turmaId).toLowerCase();
      const profNome = getProfessorNome(item.turmaId, item.professorId).toLowerCase();
      const just = (item.justificativaRetroativa || "").toLowerCase();
      const dataStr = item.data.toLowerCase();

      return (
        turmaNome.includes(termo) ||
        profNome.includes(termo) ||
        just.includes(termo) ||
        dataStr.includes(termo)
      );
    });
  }, [pendencias, busca, turmasMap, funcionariosMap]);

  async function handleAprovar(item: ExecucaoAulaApi) {
    try {
      setProcessandoId(item.id);
      const userId = user?.id || "coordenador";
      await execucoesAulaApi.avaliarPendencia(item.id, {
        aprovado: true,
        userId,
      });

      setPendencias((prev) => prev.filter((p) => p.id !== item.id));
      setAprovadasCount((c) => c + 1);
      toast.success(`Aula da turma "${getTurmaNome(item.turmaId)}" aprovada e ponto sincronizado!`);
    } catch (err: any) {
      console.error("Erro ao aprovar aula pendente:", err);
      toast.error(`Falha ao aprovar aula: ${err?.message || "Tente novamente."}`);
    } finally {
      setProcessandoId(null);
    }
  }

  function abrirModalRejeicao(item: ExecucaoAulaApi) {
    setRejeicaoModalItem(item);
    setMotivoRejeicao("");
  }

  async function handleConfirmarRejeicao() {
    if (!rejeicaoModalItem) return;
    if (!motivoRejeicao.trim()) {
      toast.error("Por favor, informe o motivo da rejeição.");
      return;
    }

    try {
      setProcessandoId(rejeicaoModalItem.id);
      const userId = user?.id || "coordenador";
      await execucoesAulaApi.avaliarPendencia(rejeicaoModalItem.id, {
        aprovado: false,
        userId,
        motivoRejeicao: motivoRejeicao.trim(),
      });

      const turmaNome = getTurmaNome(rejeicaoModalItem.id);
      setPendencias((prev) => prev.filter((p) => p.id !== rejeicaoModalItem.id));
      setRejeitadasCount((c) => c + 1);
      toast.info(`Lançamento da aula rejeitado.`);
      setRejeicaoModalItem(null);
      setMotivoRejeicao("");
    } catch (err: any) {
      console.error("Erro ao rejeitar aula pendente:", err);
      toast.error(`Falha ao rejeitar aula: ${err?.message || "Tente novamente."}`);
    } finally {
      setProcessandoId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Navegação e Cabeçalho */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Link
            href={`/nucleos/${nucleo.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar para {nucleo.identificacao}</span>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
                Aprovação de Pendências Retroativas
              </h1>
              <Badge tone="amber">{pendencias.length} pendentes</Badge>
            </div>
            <p className="text-sm text-zinc-500 mt-1">
              Auditoria e validação de aulas iniciadas fora da janela regulamentar ou retroativamente no núcleo{" "}
              <strong className="text-zinc-700">{nucleo.identificacao}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Atualizar Lista
            </Button>
          </div>
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Pendências Aguardando"
          value={pendencias.length}
          tone="sky"
          icon={Clock}
        />
        <StatCard
          label="Aprovadas nesta Sessão"
          value={aprovadasCount}
          tone="green"
          icon={CheckCircle2}
        />
        <StatCard
          label="Rejeitadas nesta Sessão"
          value={rejeitadasCount}
          tone="red"
          icon={XCircle}
        />
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-zinc-200 shadow-xs">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por turma, professor, data ou motivo..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
          />
        </div>
        <div className="text-xs text-zinc-500 font-medium">
          Exibindo {pendenciasFiltradas.length} de {pendencias.length} pendências
        </div>
      </div>

      {/* Lista de Itens Pendentes */}
      {pendenciasFiltradas.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center border-dashed border-2 border-zinc-200 bg-zinc-50/50">
          <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4 shadow-xs">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900">
            {busca.trim() ? "Nenhuma pendência encontrada" : "Tudo em dia!"}
          </h3>
          <p className="text-sm text-zinc-500 max-w-md mt-1 mb-6">
            {busca.trim()
              ? `Não foram encontrados registros para o termo "${busca}". Tente limpar a busca.`
              : "Não há lançamentos retroativos ou fora da janela aguardando aprovação para este núcleo."}
          </p>
          {busca.trim() ? (
            <Button variant="outline" size="sm" onClick={() => setBusca("")}>
              Limpar busca
            </Button>
          ) : (
            <Link href={`/nucleos/${nucleo.id}`}>
              <Button variant="outline" size="sm">
                Voltar ao Painel do Núcleo
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {pendenciasFiltradas.map((item) => {
            const turmaNome = getTurmaNome(item.turmaId);
            const professorNome = getProfessorNome(item.turmaId, item.professorId);
            const fotoUrl = formatStorageUrl(item.fotoComprovanteUrl);
            const isProcessing = processandoId === item.id;

            return (
              <Card
                key={item.id}
                className="overflow-hidden border border-zinc-200 hover:border-zinc-300 transition-all shadow-xs"
              >
                <div className="p-5 flex flex-col lg:flex-row gap-6">
                  {/* Informações Principais da Aula */}
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                        <h3 className="text-base font-bold text-zinc-900">{turmaNome}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone="amber">Pendente de Aprovação</Badge>
                        <span className="text-xs text-zinc-400">
                          ID: #{item.id.slice(0, 8)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
                        <User className="h-4 w-4 text-zinc-400 shrink-0" />
                        <div>
                          <p className="text-zinc-400 font-medium">Professor / Responsável</p>
                          <p className="text-zinc-800 font-semibold truncate">{professorNome}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
                        <Calendar className="h-4 w-4 text-zinc-400 shrink-0" />
                        <div>
                          <p className="text-zinc-400 font-medium">Data da Aula</p>
                          <p className="text-zinc-800 font-semibold">{formatarData(item.data)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
                        <Clock className="h-4 w-4 text-zinc-400 shrink-0" />
                        <div>
                          <p className="text-zinc-400 font-medium">Janela Prevista</p>
                          <p className="text-zinc-800 font-semibold">
                            {item.horaInicioPrevista || "--:--"} às {item.horaFimPrevista || "--:--"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Justificativa do Professor */}
                    <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-4">
                      <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs uppercase tracking-wider mb-1.5">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>Justificativa de Lançamento Fora do Prazo</span>
                      </div>
                      <p className="text-sm text-amber-950 font-normal leading-relaxed">
                        {item.justificativaRetroativa || (
                          <span className="italic text-zinc-400">
                            Nenhuma justificativa textual fornecida.
                          </span>
                        )}
                      </p>
                      {item.criadoEm && (
                        <p className="text-[11px] text-amber-700/80 mt-2">
                          Lançado em: {formatarData(item.criadoEm, true)}
                          {item.horaInicioReal ? ` • Registro Real: ${item.horaInicioReal}` : ""}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Foto Comprobatória e Ações */}
                  <div className="lg:w-72 shrink-0 flex flex-col justify-between gap-4 border-t lg:border-t-0 lg:border-l border-zinc-100 lg:pl-6 pt-4 lg:pt-0">
                    {/* Preview da Foto */}
                    <div>
                      <span className="text-xs font-semibold text-zinc-600 block mb-2">
                        Foto Comprobatória
                      </span>
                      {fotoUrl ? (
                        <div
                          onClick={() => {
                            setFotoModalUrl(fotoUrl);
                            setFotoModalTitulo(`${turmaNome} - ${formatarData(item.data)}`);
                          }}
                          className="group relative h-40 w-full rounded-xl overflow-hidden border border-zinc-200 bg-zinc-100 cursor-pointer shadow-xs"
                        >
                          <img
                            src={fotoUrl}
                            alt="Foto da chamada"
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-medium text-xs">
                            <Eye className="h-4 w-4" />
                            <span>Visualizar Ampliada</span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-40 w-full rounded-xl border border-dashed border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center text-zinc-400 p-4 text-center">
                          <ImageIcon className="h-8 w-8 mb-1 opacity-50" />
                          <span className="text-xs font-medium">Sem foto anexada</span>
                          <span className="text-[10px] text-zinc-400">Foto não enviada pelo professor</span>
                        </div>
                      )}
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2 pt-2">
                      <Button
                        size="md"
                        loading={isProcessing}
                        disabled={isProcessing}
                        onClick={() => handleAprovar(item)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs"
                      >
                        <Check className="h-4 w-4" />
                        Aprovar Aula e Ponto
                      </Button>

                      <Button
                        variant="outline"
                        size="md"
                        disabled={isProcessing}
                        onClick={() => abrirModalRejeicao(item)}
                        className="w-full border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 text-xs font-semibold"
                      >
                        <X className="h-4 w-4" />
                        Rejeitar Lançamento
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Foto Ampliada */}
      {fotoModalUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setFotoModalUrl(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-900/90 text-white">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-zinc-400" />
                <span className="text-sm font-semibold truncate">{fotoModalTitulo}</span>
              </div>
              <button
                onClick={() => setFotoModalUrl(null)}
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-2 flex items-center justify-center bg-black/90 max-h-[75vh] overflow-hidden">
              <img
                src={fotoModalUrl}
                alt="Comprovante de Aula"
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg"
              />
            </div>

            <div className="px-5 py-3 bg-zinc-900 border-t border-zinc-800 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFotoModalUrl(null)}
                className="text-zinc-200 border-zinc-700 hover:bg-zinc-800"
              >
                Fechar Visualização
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Rejeição de Pendência */}
      {rejeicaoModalItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setRejeicaoModalItem(null)}
        >
          <div
            className="relative max-w-md w-full bg-white rounded-2xl p-6 shadow-2xl border border-zinc-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2.5 text-red-600">
                <div className="p-2 rounded-xl bg-red-50">
                  <XCircle className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-zinc-900">Rejeitar Lançamento</h3>
              </div>
              <button
                onClick={() => setRejeicaoModalItem(null)}
                className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="py-4 flex flex-col gap-3">
              <p className="text-xs text-zinc-600">
                Você está rejeitando o lançamento da aula da turma{" "}
                <strong className="text-zinc-900">
                  {getTurmaNome(rejeicaoModalItem.turmaId)}
                </strong>{" "}
                referente a <strong className="text-zinc-900">{formatarData(rejeicaoModalItem.data)}</strong>.
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-700">
                  Motivo da Rejeição <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={motivoRejeicao}
                  onChange={(e) => setMotivoRejeicao(e.target.value)}
                  placeholder="Explique o motivo da não validação desta aula para ciência do professor..."
                  className="w-full p-3 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejeicaoModalItem(null)}
                disabled={processandoId === rejeicaoModalItem.id}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={processandoId === rejeicaoModalItem.id}
                disabled={processandoId === rejeicaoModalItem.id || !motivoRejeicao.trim()}
                onClick={handleConfirmarRejeicao}
              >
                Confirmar Rejeição
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
