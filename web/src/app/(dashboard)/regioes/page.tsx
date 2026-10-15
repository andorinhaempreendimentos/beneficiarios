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

      {/* Listagem em Cards com Tabela de Gestão */}
      <Card>
        {loading ? (
          <div className="py-16 text-center text-sm text-zinc-500">
            Carregando regiões...
          </div>
        ) : regioes.length === 0 ? (
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
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wider bg-zinc-50/75 dark:bg-zinc-900/50">
                <tr>
                  <th className="px-5 py-3.5">Região</th>
                  <th className="px-5 py-3.5">Projeto / Objeto</th>
                  <th className="px-5 py-3.5">Núcleos Pertencentes</th>
                  <th className="px-5 py-3.5 text-center">Total de Núcleos</th>
                  {canManage && <th className="px-5 py-3.5 text-right">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {regioes.map((regiao) => (
                  <tr
                    key={regiao.id}
                    className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400 shrink-0">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {regiao.nome}
                          </div>
                          {regiao.descricao && (
                            <div className="text-xs text-zinc-500 line-clamp-1 max-w-xs">
                              {regiao.descricao}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                        <FolderKanban className="h-3.5 w-3.5 text-zinc-400" />
                        {regiao.objeto?.nome || "Projeto"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      {regiao.nucleos && regiao.nucleos.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 max-w-md">
                          {regiao.nucleos.map((n) => (
                            <span
                              key={n.id}
                              className="inline-flex items-center gap-1 rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:text-zinc-300"
                            >
                              <Building2 className="h-3 w-3 text-zinc-400" />
                              {n.identificacao}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-400 italic">Nenhum núcleo alocado</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center justify-center rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 px-2.5 py-0.5 text-xs font-semibold">
                        {regiao.totalNucleos ?? regiao.nucleos?.length ?? 0}
                      </span>
                    </td>

                    {canManage && (
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAbrirEdicao(regiao)}
                            className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-700 px-2.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                            title="Editar região e alocar núcleos"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Editar / Alocar
                          </button>
                          <button
                            type="button"
                            onClick={() => setExcluindoId(regiao.id)}
                            className="inline-flex items-center justify-center rounded-lg p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 cursor-pointer transition-colors"
                            title="Excluir região"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > PER_PAGE && (
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
            <Pagination
              currentPage={pagina}
              totalPages={Math.ceil(total / PER_PAGE)}
              totalItems={total}
              itemsPerPage={PER_PAGE}
              onPageChange={setPagina}
            />
          </div>
        )}
      </Card>

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
