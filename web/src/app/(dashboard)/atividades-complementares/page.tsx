"use client";

import { useState } from "react";
import { Plus, Calendar, Users, MapPin, Search } from "lucide-react";
import { Button, Card, CardBody, CardHeader, PageHeader, LinkButton, Badge, Input, Select } from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import {
  atividadesComplementaresApi,
  objetosApi,
  nucleosApi,
  type AtividadeComplementarApi,
  type TipoAtividadeComplementar,
} from "@/lib/api/services";
import { formatarData } from "@/lib/utils";

const TIPO_LABEL: Record<TipoAtividadeComplementar, string> = {
  evento_esportivo: "Evento Esportivo / Festival",
  reuniao_familia: "Reunião com Famílias",
  capacitacao: "Capacitação de Equipe",
  oficina_socioeducativa: "Oficina Socioeducativa",
  outro: "Outra Ação",
};

const TIPO_TONE: Record<TipoAtividadeComplementar, "sky" | "green" | "amber" | "zinc" | "red"> = {
  evento_esportivo: "green",
  reuniao_familia: "sky",
  capacitacao: "amber",
  oficina_socioeducativa: "sky",
  outro: "zinc",
};

export default function AtividadesComplementaresPage() {
  const [busca, setBusca] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [nucleoFiltro, setNucleoFiltro] = useState("");

  const { data: objetosRes } = useQuery(() => objetosApi.list({ limit: 1 }), []);
  const objetoAtivo = objetosRes?.data[0];

  const { data: nucleosRes } = useQuery(() => nucleosApi.list({ limit: 100 }), []);
  const nucleos = nucleosRes?.data ?? [];

  const { data: ativRes, loading, refetch } = useQuery(
    () =>
      objetoAtivo?.id
        ? atividadesComplementaresApi.list({
            objetoId: objetoAtivo.id,
            tipo: tipoFiltro || undefined,
            nucleoId: nucleoFiltro || undefined,
            busca: busca || undefined,
            limit: 100,
          })
        : Promise.resolve({ data: [], total: 0, page: 1, limit: 100 }),
    [objetoAtivo?.id, tipoFiltro, nucleoFiltro, busca]
  );

  const atividades = ativRes?.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Atividades Especiais Extra-Grade"
        description="Registro de eventos esportivos, festivais comunitários, reuniões de pais e capacitações para comprovação no plano de trabalho"
        actions={
          <LinkButton href="/atividades-complementares/nova">
            <Plus className="h-4 w-4 mr-1.5" />
            Nova Atividade / Evento
          </LinkButton>
        }
      />

      {/* Filtros */}
      <Card>
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-zinc-500">Buscar por Título</label>
            <div className="relative mt-1">
              <Input
                placeholder="Ex: Torneio Integração, Reunião Trimestral..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500">Tipo de Atividade</label>
            <Select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value)}
              className="mt-1"
            >
              <option value="">Todos os Tipos</option>
              <option value="evento_esportivo">Evento Esportivo / Festival</option>
              <option value="reuniao_familia">Reunião com Famílias</option>
              <option value="capacitacao">Capacitação de Equipe</option>
              <option value="oficina_socioeducativa">Oficina Socioeducativa</option>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500">Núcleo</label>
            <Select
              value={nucleoFiltro}
              onChange={(e) => setNucleoFiltro(e.target.value)}
              className="mt-1"
            >
              <option value="">Todos os Núcleos (ou Geral)</option>
              {nucleos.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.identificacao}
                </option>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Grid de Atividades */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {atividades.map((a) => (
          <Card key={a.id} className="flex flex-col justify-between overflow-hidden">
            <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 pb-3">
              <div className="flex items-start justify-between gap-2">
                <Badge tone={TIPO_TONE[a.tipo] ?? "zinc"}>{TIPO_LABEL[a.tipo] ?? a.tipo}</Badge>
                <span className="flex items-center text-xs font-medium text-zinc-500">
                  <Calendar className="mr-1 h-3.5 w-3.5" />
                  {formatarData(a.data)}
                </span>
              </div>
              <h3 className="mt-2 text-base font-semibold text-zinc-800">{a.titulo}</h3>
            </CardHeader>
            <CardBody className="flex flex-1 flex-col justify-between gap-3 text-sm text-zinc-600">
              <p className="line-clamp-3 text-xs text-zinc-500">
                {a.descricao || "Sem descrição detalhada."}
              </p>

              <div className="flex flex-col gap-1.5 border-t border-zinc-100 pt-2 text-xs text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                  <span>{a.nucleoNome || "Geral / Todos os Núcleos"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-zinc-400" />
                  <span>
                    <strong className="font-semibold text-zinc-700">{a.quantidadeParticipantes}</strong> participantes
                  </span>
                </div>
                {a.fotosUrls && a.fotosUrls.length > 0 && (
                  <span className="text-sky-600 font-medium">
                    📷 {a.fotosUrls.length} foto(s) anexada(s)
                  </span>
                )}
              </div>
            </CardBody>
          </Card>
        ))}

        {atividades.length === 0 && !loading && (
          <div className="col-span-full rounded-xl border border-dashed border-zinc-300 p-12 text-center">
            <Calendar className="mx-auto h-8 w-8 text-zinc-400" />
            <h4 className="mt-2 text-sm font-semibold text-zinc-700">Nenhuma atividade especial cadastrada</h4>
            <p className="mt-1 text-xs text-zinc-400">
              Cadastre eventos esportivos, reuniões de responsáveis ou capacitações para comprovação no relatório.
            </p>
            <div className="mt-4">
              <LinkButton href="/atividades-complementares/nova" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Cadastrar Primeira Atividade
              </LinkButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
