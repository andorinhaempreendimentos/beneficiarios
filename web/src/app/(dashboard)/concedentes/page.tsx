"use client";

import { useState, useCallback } from "react";
import { Plus, Building2, MapPin, UserCheck, Phone, Mail, Edit2, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  FilterBar,
  Field,
  Input,
  Select,
  PageHeader,
  Pagination,
} from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import { concedentesApi, type ConcedenteApi, type Paginated } from "@/lib/api/services";
import { ModalConcedenteForm } from "@/components/concedentes/ModalConcedenteForm";

const PER_PAGE = 12;

export default function ConcedentesPage() {
  const [busca, setBusca] = useState("");
  const [esferaFiltro, setEsferaFiltro] = useState("");
  const [pagina, setPagina] = useState(1);

  const [modalAberto, setModalAberto] = useState(false);
  const [concedenteParaEditar, setConcedenteParaEditar] = useState<ConcedenteApi | null>(null);
  const [concedenteParaExcluir, setConcedenteParaExcluir] = useState<ConcedenteApi | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const { data: pageData, loading, refetch } = useQuery<Paginated<ConcedenteApi>>(
    () =>
      concedentesApi.list({
        busca: busca.trim() || undefined,
        esfera: (esferaFiltro as any) || undefined,
        page: pagina,
        limit: PER_PAGE,
      }),
    [busca, esferaFiltro, pagina]
  );

  const concedentes = pageData?.data ?? [];
  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  function handleAbrirNovo() {
    setConcedenteParaEditar(null);
    setModalAberto(true);
  }

  function handleAbrirEditar(item: ConcedenteApi) {
    setConcedenteParaEditar(item);
    setModalAberto(true);
  }

  async function confirmarExclusao() {
    if (!concedenteParaExcluir) return;
    setExcluindo(true);
    try {
      await concedentesApi.remove(concedenteParaExcluir.id);
      setConcedenteParaExcluir(null);
      refetch();
    } catch (err: any) {
      alert("Erro ao excluir concedente: " + (err?.message || "Verifique se existem objetos vinculados."));
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Órgãos Concedentes"
        description="Cadastro e gestão de órgãos do poder público concedentes e parceiros institucionais (SEJUVES, Ministérios, Secretarias)"
        actions={
          <Button onClick={handleAbrirNovo}>
            <Plus className="mr-1.5 h-4 w-4" />
            Novo Concedente
          </Button>
        }
      />

      <FilterBar onFilter={() => { setPagina(1); refetch(); }} onClear={() => { setBusca(""); setEsferaFiltro(""); setPagina(1); }}>
        <Field label="Buscar por nome, responsável ou cidade">
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Ex: SEJUVES, Esportes, Palmas..."
          />
        </Field>
        <Field label="Esfera Administrativa">
          <Select value={esferaFiltro} onChange={(e) => setEsferaFiltro(e.target.value)}>
            <option value="">Todas as esferas</option>
            <option value="municipal">Municipal</option>
            <option value="estadual">Estadual</option>
            <option value="federal">Federal</option>
          </Select>
        </Field>
      </FilterBar>

      {loading ? (
        <div className="flex justify-center py-12 text-sm text-zinc-500">
          Carregando órgãos concedentes...
        </div>
      ) : concedentes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 p-12 text-center">
          <Building2 className="h-10 w-10 text-zinc-400 mb-3" />
          <h3 className="text-base font-semibold text-zinc-800">Nenhum órgão concedente encontrado</h3>
          <p className="text-sm text-zinc-500 mt-1">
            Cadastre o primeiro órgão parceiro para vincular aos termos e objetos de colaboração.
          </p>
          <Button onClick={handleAbrirNovo} className="mt-4">
            <Plus className="mr-1.5 h-4 w-4" />
            Cadastrar Concedente
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {concedentes.map((c) => (
            <Card key={c.id} className="flex flex-col justify-between p-5 hover:border-zinc-300 transition-colors">
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <Badge tone={c.esfera === "federal" ? "violet" : c.esfera === "estadual" ? "amber" : "sky"}>
                        {c.esfera.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleAbrirEditar(c)}
                      className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                      title="Editar Concedente"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConcedenteParaExcluir(c)}
                      className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                      title="Excluir Concedente"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-zinc-900 text-sm line-clamp-2" title={c.nome}>
                  {c.nome}
                </h3>

                {c.cnpj && (
                  <p className="text-xs text-zinc-500 mt-1">
                    CNPJ: <strong>{c.cnpj}</strong>
                  </p>
                )}

                <div className="mt-4 space-y-1.5 text-xs text-zinc-600 border-t border-zinc-100 pt-3">
                  {(c.cidade || c.estado) && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      <span>{c.cidade ? `${c.cidade} / ${c.estado || "BR"}` : c.estado}</span>
                    </div>
                  )}

                  {c.responsavelNome && (
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      <span>{c.responsavelNome} {c.responsavelCargo ? `(${c.responsavelCargo})` : ""}</span>
                    </div>
                  )}

                  {c.telefone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      <span>{c.telefone}</span>
                    </div>
                  )}

                  {c.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate">{c.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={pagina}
          totalPages={totalPages}
          totalItems={total}
          itemsPerPage={PER_PAGE}
          onPageChange={setPagina}
        />
      )}

      {/* Modal de Criação/Edição */}
      <ModalConcedenteForm
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onSuccess={() => refetch()}
        concedenteParaEditar={concedenteParaEditar}
      />

      {/* Modal de Confirmação de Exclusão */}
      {concedenteParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-zinc-900">Excluir Órgão Concedente?</h3>
            <p className="text-xs text-zinc-600">
              Tem certeza que deseja remover <strong>{concedenteParaExcluir.nome}</strong>? Esta ação só terá efeito se não houver termos/objetos vinculados.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConcedenteParaExcluir(null)}
                disabled={excluindo}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={confirmarExclusao}
                disabled={excluindo}
              >
                {excluindo ? "Excluindo..." : "Confirmar Exclusão"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
