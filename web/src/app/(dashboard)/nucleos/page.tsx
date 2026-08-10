"use client";

import { useState, useCallback } from "react";
import { Building2, MapPin, Download } from "lucide-react";
import Link from "next/link";
import {
  Badge,
  Card,
  FilterBar,
  Field,
  Input,
  Select,
  LinkButton,
  PageHeader,
  Pagination,
  ViewToggle,
  BulkActionsBar,
  type ViewMode,
} from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import { StatusNucleoBadge } from "@/components/nucleos/StatusNucleoBadge";
import { useDicionario } from "@/components/providers/DictionaryProvider";
import {
  nucleosApi,
  organizacoesApi,
  objetosApi,
  atividadesApi,
  type Paginated,
  type NucleoApi,
  type OrganizacaoApi,
  type ObjetoApi,
  type AtividadeApi,
} from "@/lib/api/services";
import { formatarData } from "@/lib/utils";

const PER_PAGE = 15;
const EMPTY = {
  busca: "",
  objetoId: "",
  organizacaoId: "",
  cidade: "",
  atividadeId: "",
  emFuncionamento: "",
  disponivelPreInscricao: "",
};

export default function NucleosPage() {
  const { t } = useDicionario();
  const [filtros, setFiltros] = useState(EMPTY);
  const [pagina, setPagina] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: objetosRes } = useQuery<Paginated<ObjetoApi>>(() => objetosApi.list({ limit: 100 }), []);
  const { data: organizacoesRes } = useQuery<Paginated<OrganizacaoApi>>(() => organizacoesApi.list({ limit: 100 }), []);
  const { data: atividadesRes } = useQuery<Paginated<AtividadeApi>>(() => atividadesApi.list({ limit: 100 }), []);

  const objetos = objetosRes?.data ?? [];
  const organizacoes = organizacoesRes?.data ?? [];
  const atividades = atividadesRes?.data ?? [];

  const { data: pageData, loading } = useQuery<Paginated<NucleoApi & { organizacao?: { id: string; nome: string; objetoId: string } }>>(
    () => nucleosApi.list({ ...filtros, page: pagina, limit: PER_PAGE }),
    [filtros, pagina],
  );

  const resultado = pageData?.data ?? [];
  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const limpar = useCallback(() => { setFiltros(EMPTY); setPagina(1); }, []);

  function setCampo(chave: keyof typeof EMPTY, valor: string) {
    setPagina(1);
    setFiltros((f) => ({ ...f, [chave]: valor }));
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === resultado.length && resultado.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(resultado.map((n) => n.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const allSelected = resultado.length > 0 && selectedIds.length === resultado.length;

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title={t("local", "Núcleo", true)}
        description={`Listagem e gestão de ${t("local", "Núcleo", true).toLowerCase()}`}
        actions={
          <div className="flex items-center gap-3">
            <ViewToggle mode={viewMode} onChange={setViewMode} />
            <LinkButton href="/nucleos/novo">{`Novo ${t("local", "Núcleo").toLowerCase()}`}</LinkButton>
          </div>
        }
      />

      <FilterBar onClear={limpar}>
        <Field label="Busca">
          <Input
            placeholder="Nome ou identificação..."
            value={filtros.busca}
            onChange={(e) => setCampo("busca", e.target.value)}
          />
        </Field>

        <Field label={t("objeto", "Objeto")}>
          <Select
            value={filtros.objetoId}
            onChange={(e) => setCampo("objetoId", e.target.value)}
          >
            <option value="">Todos os objetos</option>
            {objetos.map((ob) => (
              <option key={ob.id} value={ob.id}>{ob.nome}</option>
            ))}
          </Select>
        </Field>

        <Field label={t("organizacao", "Organização")}>
          <Select
            value={filtros.organizacaoId}
            onChange={(e) => setCampo("organizacaoId", e.target.value)}
          >
            <option value="">Todas as organizações</option>
            {organizacoes.map((org) => (
              <option key={org.id} value={org.id}>{org.nome}</option>
            ))}
          </Select>
        </Field>

        <Field label="Cidade">
          <Input
            placeholder="Filtrar por cidade..."
            value={filtros.cidade}
            onChange={(e) => setCampo("cidade", e.target.value)}
          />
        </Field>

        <Field label={t("atividade", "Atividade")}>
          <Select
            value={filtros.atividadeId}
            onChange={(e) => setCampo("atividadeId", e.target.value)}
          >
            <option value="">Todas as atividades</option>
            {atividades.map((atv) => (
              <option key={atv.id} value={atv.id}>{atv.nome}</option>
            ))}
          </Select>
        </Field>

        <Field label="Status">
          <Select
            value={filtros.emFuncionamento}
            onChange={(e) => setCampo("emFuncionamento", e.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="true">Em funcionamento (Ativo)</option>
            <option value="false">Inativo</option>
          </Select>
        </Field>
      </FilterBar>

      <Card>
        {loading && <div className="px-5 py-8 text-center text-sm text-zinc-400">Carregando núcleos…</div>}
        {!loading && (
          <>
            {viewMode === "cards" ? (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resultado.length === 0 ? (
                  <div className="col-span-full px-5 py-8 text-center text-sm text-zinc-400">
                    Nenhum {t("local", "Núcleo").toLowerCase()} encontrado para os filtros selecionados.
                  </div>
                ) : (
                  resultado.map((nucleo) => {
                    const isSelected = selectedIds.includes(nucleo.id);
                    return (
                      <div
                        key={nucleo.id}
                        className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                          isSelected
                            ? "border-sky-500 bg-sky-50/30 ring-1 ring-sky-500"
                            : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectOne(nucleo.id)}
                              className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                            />
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-zinc-400 shrink-0" />
                              <div>
                                <Link href={`/nucleos/${nucleo.id}`} className="font-bold text-zinc-900 text-sm hover:text-sky-600">
                                  {nucleo.identificacao}
                                </Link>
                                {nucleo.nomeLocal && <span className="text-xs text-zinc-400 block">{nucleo.nomeLocal}</span>}
                              </div>
                            </div>
                          </div>
                          <StatusNucleoBadge nucleoId={nucleo.id} emFuncionamento={nucleo.emFuncionamento} />
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-zinc-600 border-t border-zinc-100 pt-2.5">
                          <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                          <span>{[nucleo.bairro, nucleo.cidade].filter(Boolean).join(" · ") || "—"}</span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-zinc-500 border-t border-zinc-100/60 pt-2">
                          <span className="truncate max-w-[60%]">{nucleo.organizacao?.nome || "—"}</span>
                          <div className="flex items-center gap-3">
                            <Link href={`/nucleos/${nucleo.id}`} className="text-xs font-semibold text-sky-600 hover:underline">
                              Acessar
                            </Link>
                            <span className="text-zinc-300">|</span>
                            <Link href={`/nucleos/${nucleo.id}/editar`} className="text-xs text-zinc-500 hover:underline">
                              Editar
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 bg-zinc-50/50">
                      <th className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                        />
                      </th>
                      <th className="px-5 py-3">{t("local", "Núcleo")}</th>
                      <th className="px-5 py-3">Cidade / Bairro</th>
                      <th className="px-5 py-3">{t("organizacao", "Organização")}</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Início</th>
                      <th className="px-5 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-8 text-center text-sm text-zinc-400">
                          Nenhum {t("local", "Núcleo").toLowerCase()} encontrado para os filtros selecionados.
                        </td>
                      </tr>
                    ) : (
                      resultado.map((nucleo) => {
                        const isSelected = selectedIds.includes(nucleo.id);
                        return (
                          <tr key={nucleo.id} className={`border-b border-zinc-100 last:border-0 hover:bg-zinc-50 ${isSelected ? "bg-sky-50/30" : ""}`}>
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectOne(nucleo.id)}
                                className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                              />
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-zinc-400 shrink-0" />
                                <div>
                                  <span className="font-medium text-zinc-900 block">{nucleo.identificacao}</span>
                                  {nucleo.nomeLocal && <span className="text-xs text-zinc-400">{nucleo.nomeLocal}</span>}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-zinc-600">
                              <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                                <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                                <span>{[nucleo.bairro, nucleo.cidade].filter(Boolean).join(" · ") || "—"}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-xs text-zinc-600 font-medium">
                              {nucleo.organizacao?.nome || "—"}
                            </td>
                            <td className="px-5 py-3">
                              <StatusNucleoBadge nucleoId={nucleo.id} emFuncionamento={nucleo.emFuncionamento} />
                            </td>
                            <td className="px-5 py-3 text-zinc-600 text-xs">{formatarData(nucleo.dataInicio)}</td>
                            <td className="px-5 py-3 text-right">
                              <Link href={`/nucleos/${nucleo.id}`} className="text-sky-600 hover:underline">Acessar</Link>
                              <span className="mx-1.5 text-zinc-300">|</span>
                              <Link href={`/nucleos/${nucleo.id}/editar`} className="text-zinc-500 hover:underline">Editar</Link>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
        <Pagination currentPage={pagina} totalPages={totalPages} totalItems={total} itemsPerPage={PER_PAGE} onPageChange={setPagina} />
      </Card>

      <BulkActionsBar
        selectedCount={selectedIds.length}
        totalCount={resultado.length}
        allSelected={allSelected}
        onSelectAll={toggleSelectAll}
        onClearSelection={() => setSelectedIds([])}
      >
        <button
          type="button"
          onClick={() => alert(`Exportando ${selectedIds.length} núcleo(s)...`)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-100 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Exportar</span>
        </button>
      </BulkActionsBar>
    </div>
  );
}
