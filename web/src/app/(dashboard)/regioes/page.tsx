"use client";

import { useState, useCallback, useMemo } from "react";
import {
  MapPin,
  Building2,
  Plus,
  Pencil,
  Trash2,
  FolderKanban,
  Search,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import {
  Badge,
  Card,
  PageHeader,
  Button,
  Input,
  Select,
  Pagination,
} from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import {
  regioesApi,
  objetosApi,
  type RegiaoApi,
  type ObjetoApi,
  type Paginated,
} from "@/lib/api/services";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { ModalRegiaoForm } from "@/components/regioes/ModalRegiaoForm";

const PER_PAGE = 12;

export default function RegioesPage() {
  const { toast } = useToast();
  const { user } = useAuth();

  // Verificação de autoridade estrita
  const canManage = Boolean(
    user && user.tipo !== "funcionario" && !user.isProfessor && !user.isCoordenador
  );

  const [busca, setBusca] = useState("");
  const [objetoIdFiltro, setObjetoIdFiltro] = useState("");
  const [pagina, setPagina] = useState(1);

  // Estados de modal
  const [modalAberto, setModalAberto] = useState(false);
  const [regiaoParaEditar, setRegiaoParaEditar] = useState<RegiaoApi | null>(null);

  // Exclusão
  const [excluindoId, setExcluindoId] = useState<string | null>(null);
  const [loadingExcluir, setLoadingExcluir] = useState(false);

  // Busca lista de objetos para filtro e criação
  const { data: objetosRes } = useQuery<Paginated<ObjetoApi>>(
    () => objetosApi.list({ limit: 100 }),
    []
  );
  const objetos = objetosRes?.data ?? [];

  // Busca lista de regiões
  const fetchRegioes = useCallback(async () => {
    return regioesApi.list({
      busca: busca.trim() || undefined,
      objetoId: objetoIdFiltro || undefined,
      page: pagina,
      limit: PER_PAGE,
    });
  }, [busca, objetoIdFiltro, pagina]);

  const { data: regioesRes, loading, refetch } = useQuery<Paginated<RegiaoApi>>(
    fetchRegioes,
    [fetchRegioes]
  );

  const regioes = regioesRes?.data ?? [];
  const total = regioesRes?.total ?? 0;

  function handleAbrirCriacao() {
    if (!canManage) {
      toast.error("Você não possui permissão para criar regiões.");
      return;
    }
    setRegiaoParaEditar(null);
    setModalAberto(true);
  }

  function handleAbrirEdicao(regiao: RegiaoApi) {
    if (!canManage) {
      toast.error("Você não possui permissão para editar regiões.");
      return;
    }
    setRegiaoParaEditar(regiao);
    setModalAberto(true);
  }

  async function handleConfirmarExclusao() {
    if (!excluindoId) return;
    if (!canManage) {
      toast.error("Você não possui permissão para excluir regiões.");
      return;
    }

    setLoadingExcluir(true);
    try {
      await regioesApi.remove(excluindoId);
      toast.success("Região removida com sucesso. Os núcleos associados foram desvinculados.");
      setExcluindoId(null);
      refetch();
    } catch (err: any) {
      console.error("Erro ao excluir região:", err);
      toast.error(err?.message || "Erro ao excluir região.");
    } finally {
      setLoadingExcluir(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <PageHeader
        title="Regiões"
        description="Divisão territorial e agrupamento de núcleos por objeto de fomento."
        actions={
          canManage ? (
            <Button onClick={handleAbrirCriacao} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Região
            </Button>
          ) : undefined
        }
      />

      {/* Alerta de Autoridade (se usuário não tiver permissão de gestão) */}
      {!canManage && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
          <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <span className="font-semibold">Modo de Apenas Visualização:</span>
            <p className="mt-0.5">
              Seu perfil não possui autoridade para criar, editar regiões ou transferir núcleos.
            </p>
          </div>
        </div>
      )}

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Buscar por nome da região..."
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setPagina(1);
            }}
            className="pl-9"
          />
        </div>

        <div className="w-full sm:w-64">
          <Select
            value={objetoIdFiltro}
            onChange={(e) => {
              setObjetoIdFiltro(e.target.value);
              setPagina(1);
            }}
          >
            <option value="">Todos os Projetos / Objetos</option>
            {objetos.map((obj) => (
              <option key={obj.id} value={obj.id}>
                {obj.nome}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Listagem de Regiões em Cards */}
      {loading ? (
        <Card>
          <div className="py-16 text-center text-sm text-zinc-500">
            Carregando regiões...
          </div>
        </Card>
      ) : regioes.length === 0 ? (
        <Card>
          <div className="py-16 text-center">
            <MapPin className="mx-auto h-10 w-10 text-zinc-300 dark:text-zinc-600 mb-3" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Nenhuma região encontrada
            </h3>
            <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
              {busca || objetoIdFiltro
                ? "Tente ajustar os filtros de busca para encontrar o que procura."
                : "Crie a primeira região para começar a organizar os núcleos do projeto."}
            </p>
            {canManage && !busca && !objetoIdFiltro && (
              <Button onClick={handleAbrirCriacao} className="mt-4 gap-2 text-xs">
                <Plus className="h-3.5 w-3.5" />
                Criar Primeira Região
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {regioes.map((regiao) => {
              const count = regiao.totalNucleos ?? regiao.nucleos?.length ?? 0;
              return (
                <div
                  key={regiao.id}
                  className="flex flex-col justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm transition-all"
                >
                  {/* Cabeçalho do Card: Nome e Quantidade de Núcleos */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400 shrink-0">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 leading-tight truncate">
                            {regiao.nome}
                          </h3>
                          {regiao.descricao && (
                            <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">
                              {regiao.descricao}
                            </p>
                          )}
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/80 px-2.5 py-1 text-xs font-semibold shrink-0">
                        <Building2 className="h-3.5 w-3.5" />
                        {count} {count === 1 ? "núcleo" : "núcleos"}
                      </span>
                    </div>

                    {/* Projeto Vinculado */}
                    <div className="mb-4 flex items-center gap-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 border border-zinc-100 dark:border-zinc-800">
                      <FolderKanban className="h-4 w-4 text-zinc-400 shrink-0" />
                      <span className="font-medium text-zinc-500 dark:text-zinc-400">Projeto:</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {regiao.objeto?.nome || "Sem projeto vinculado"}
                      </span>
                    </div>

                    {/* Núcleos Pertencentes */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-xs text-zinc-500 font-medium">
                        <span>Núcleos pertencentes</span>
                        <span>({count})</span>
                      </div>

                      {regiao.nucleos && regiao.nucleos.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                          {regiao.nucleos.map((n) => (
                            <span
                              key={n.id}
                              className="inline-flex items-center gap-1 rounded-md bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-800 dark:text-zinc-200 border border-zinc-200/60 dark:border-zinc-700/60"
                            >
                              <Building2 className="h-3 w-3 text-zinc-400" />
                              {n.identificacao}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 p-3 text-center text-xs text-zinc-400 italic">
                          Nenhum núcleo alocado a esta região
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rodapé: Botões de Ação */}
                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2 mt-auto">
                    {canManage ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAbrirEdicao(regiao)}
                          className="flex-1 gap-1.5 text-xs font-semibold"
                        >
                          <Pencil className="h-3.5 w-3.5 text-zinc-500" />
                          Editar / Alocar
                        </Button>
                        <button
                          type="button"
                          onClick={() => setExcluindoId(regiao.id)}
                          className="inline-flex items-center justify-center rounded-lg p-2 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 cursor-pointer transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-800"
                          title="Excluir região"
                          aria-label="Excluir região"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-zinc-400 italic py-1">Somente visualização</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {total > PER_PAGE && (
            <div className="pt-2">
              <Pagination
                currentPage={pagina}
                totalPages={Math.ceil(total / PER_PAGE)}
                totalItems={total}
                itemsPerPage={PER_PAGE}
                onPageChange={setPagina}
              />
            </div>
          )}
        </div>
      )}

      {/* Modal de Formulário (Criação/Edição e Alocação em Lote) */}
      <ModalRegiaoForm
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onSuccess={() => refetch()}
        regiaoParaEditar={regiaoParaEditar}
        objetos={objetos}
      />

      {/* Modal de Confirmação de Exclusão */}
      {excluindoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/60">
                <AlertCircle className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Excluir Região?
              </h3>
            </div>
            <p className="text-xs text-zinc-500 mb-5 leading-relaxed">
              Esta ação removerá a região do sistema. Os núcleos que estavam vinculados a ela não serão excluídos, mas ficarão sem região atribuída.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExcluindoId(null)}
                disabled={loadingExcluir}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmarExclusao}
                disabled={loadingExcluir}
              >
                {loadingExcluir ? "Excluindo..." : "Sim, Excluir"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
