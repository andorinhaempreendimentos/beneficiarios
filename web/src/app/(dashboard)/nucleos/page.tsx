"use client";

import { useState, useCallback } from "react";
import { Building2, MapPin } from "lucide-react";
import Link from "next/link";
import { Badge, Card, FilterBar, Field, Input, Select, LinkButton, PageHeader, Pagination } from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
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
  const [ativos, setAtivos] = useState(EMPTY);
  const [pagina, setPagina] = useState(1);

  // Buscar opções dinâmicas de filtros
  const { data: objetosRes } = useQuery<Paginated<ObjetoApi>>(() => objetosApi.list({ limit: 100 }), []);
  const { data: organizacoesRes } = useQuery<Paginated<OrganizacaoApi>>(() => organizacoesApi.list({ limit: 100 }), []);
  const { data: atividadesRes } = useQuery<Paginated<AtividadeApi>>(() => atividadesApi.list({ limit: 100 }), []);

  const objetos = objetosRes?.data ?? [];
  const organizacoes = organizacoesRes?.data ?? [];
  const atividades = atividadesRes?.data ?? [];

  const { data: pageData, loading } = useQuery<Paginated<NucleoApi & { organizacao?: { id: string; nome: string; objetoId: string } }>>(
    () => nucleosApi.list({ ...ativos, page: pagina, limit: PER_PAGE }),
    [ativos, pagina],
  );

  const resultado = pageData?.data ?? [];
  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const aplicar = useCallback(() => { setPagina(1); setAtivos(filtros); }, [filtros]);
  const limpar = useCallback(() => { setFiltros(EMPTY); setAtivos(EMPTY); setPagina(1); }, []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("local", "Núcleo", true)}
        description={`Listagem e gestão de ${t("local", "Núcleo", true).toLowerCase()}`}
        actions={<LinkButton href="/nucleos/novo">{`Novo ${t("local", "Núcleo").toLowerCase()}`}</LinkButton>}
      />

      <FilterBar onFilter={aplicar} onClear={limpar}>
        <Field label="Busca">
          <Input
            placeholder="Nome ou identificação..."
            value={filtros.busca}
            onChange={(e) => setFiltros((f) => ({ ...f, busca: e.target.value }))}
          />
        </Field>

        <Field label={t("objeto", "Objeto")}>
          <Select
            value={filtros.objetoId}
            onChange={(e) => setFiltros((f) => ({ ...f, objetoId: e.target.value }))}
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
            onChange={(e) => setFiltros((f) => ({ ...f, organizacaoId: e.target.value }))}
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
            onChange={(e) => setFiltros((f) => ({ ...f, cidade: e.target.value }))}
          />
        </Field>

        <Field label={t("atividade", "Atividade")}>
          <Select
            value={filtros.atividadeId}
            onChange={(e) => setFiltros((f) => ({ ...f, atividadeId: e.target.value }))}
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
            onChange={(e) => setFiltros((f) => ({ ...f, emFuncionamento: e.target.value }))}
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
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
                    <td colSpan={6} className="px-5 py-8 text-center text-sm text-zinc-400">
                      Nenhum {t("local", "Núcleo").toLowerCase()} encontrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  resultado.map((nucleo) => (
                    <tr key={nucleo.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
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
                        <Badge tone={nucleo.emFuncionamento ? "green" : "red"}>
                          {nucleo.emFuncionamento ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-zinc-600 text-xs">{formatarData(nucleo.dataInicio)}</td>
                      <td className="px-5 py-3 text-right">
                        <Link href={`/nucleos/${nucleo.id}`} className="text-sky-600 hover:underline">Acessar</Link>
                        <span className="mx-1.5 text-zinc-300">|</span>
                        <Link href={`/nucleos/${nucleo.id}/editar`} className="text-zinc-500 hover:underline">Editar</Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        <Pagination currentPage={pagina} totalPages={totalPages} totalItems={total} itemsPerPage={PER_PAGE} onPageChange={setPagina} />
      </Card>
    </div>
  );
}
