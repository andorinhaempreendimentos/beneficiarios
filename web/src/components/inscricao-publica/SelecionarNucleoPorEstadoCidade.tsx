"use client";

import { useState, useMemo } from "react";
import { MapPin, Globe, Building, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import type { NucleoApi } from "@/lib/api/services";

const ESTADOS_NOMES: Record<string, string> = {
  TO: "Tocantins (TO)",
  PE: "Pernambuco (PE)",
  SP: "São Paulo (SP)",
  RJ: "Rio de Janeiro (RJ)",
  DF: "Distrito Federal (DF)",
  BA: "Bahia (BA)",
  MG: "Minas Gerais (MG)",
};

interface SelecionarNucleoPorEstadoCidadeProps {
  nucleos: NucleoApi[];
}

export function SelecionarNucleoPorEstadoCidade({ nucleos }: SelecionarNucleoPorEstadoCidadeProps) {
  // Atribuir estado padrão para núcleos que possuem cidade cadastrada (ex: Palmas -> TO)
  const nucleosComEstado = useMemo(() => {
    return nucleos.map((n) => {
      let estado = (n as any).estado as string | undefined;
      if (!estado) {
        if (n.cidade?.toLowerCase() === "palmas") estado = "TO";
        else if (n.cidade?.toLowerCase() === "recife") estado = "PE";
        else estado = "TO"; // fallback padrão
      }
      return {
        ...n,
        estadoUf: estado,
        cidadeNome: n.cidade || "Palmas",
      };
    });
  }, [nucleos]);

  // Obter lista única de Estados
  const estadosDisponiveis = useMemo(() => {
    const ufs = Array.from(new Set(nucleosComEstado.map((n) => n.estadoUf))).sort();
    return ufs;
  }, [nucleosComEstado]);

  // Estado selecionado (padrão é o primeiro estado disponível)
  const [estadoSelecionado, setEstadoSelecionado] = useState<string>(
    estadosDisponiveis[0] || "TO"
  );

  // Cidades disponíveis no Estado selecionado
  const cidadesDisponiveis = useMemo(() => {
    const cidades = Array.from(
      new Set(
        nucleosComEstado
          .filter((n) => n.estadoUf === estadoSelecionado)
          .map((n) => n.cidadeNome)
      )
    ).sort();
    return cidades;
  }, [nucleosComEstado, estadoSelecionado]);

  // Cidade selecionada (padrão é a primeira cidade do estado)
  const [cidadeSelecionada, setCidadeSelecionada] = useState<string>(
    cidadesDisponiveis[0] || ""
  );

  // Se trocar o Estado, atualizar a Cidade selecionada para a primeira disponível
  const handleSelecionarEstado = (uf: string) => {
    setEstadoSelecionado(uf);
    const novasCidades = Array.from(
      new Set(
        nucleosComEstado.filter((n) => n.estadoUf === uf).map((n) => n.cidadeNome)
      )
    ).sort();
    setCidadeSelecionada(novasCidades[0] || "");
  };

  // Núcleos filtrados pelo Estado e pela Cidade selecionados
  const nucleosFiltrados = useMemo(() => {
    return nucleosComEstado.filter(
      (n) => n.estadoUf === estadoSelecionado && n.cidadeNome === cidadeSelecionada
    );
  }, [nucleosComEstado, estadoSelecionado, cidadeSelecionada]);

  // Agrupar núcleos filtrados por região
  const porRegiao = useMemo(() => {
    return nucleosFiltrados.reduce<Record<string, typeof nucleosFiltrados>>((acc, n) => {
      const regiao = n.regiao || "Todas as Regiões";
      if (!acc[regiao]) acc[regiao] = [];
      acc[regiao].push(n);
      return acc;
    }, {});
  }, [nucleosFiltrados]);

  const regioes = Object.keys(porRegiao).sort();

  return (
    <div className="flex flex-col gap-6">
      {/* Box de Seleção de Estado e Cidade */}
      <div className="rounded-2xl border border-sky-200 bg-white p-5 shadow-xs">
        <h2 className="text-sm font-bold uppercase tracking-wider text-sky-900 mb-4 flex items-center gap-2">
          <Globe className="h-4 w-4 text-sky-600" />
          Selecione sua Localização
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Passo 1: Estado */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1">
              <span>1. Estado (UF)</span>
              <span className="text-red-500">*</span>
            </label>
            <select
              value={estadoSelecionado}
              onChange={(e) => handleSelecionarEstado(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-900 shadow-2xs transition-colors focus:border-sky-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
            >
              {estadosDisponiveis.map((uf) => (
                <option key={uf} value={uf}>
                  {ESTADOS_NOMES[uf] || `Estado (${uf})`}
                </option>
              ))}
            </select>
          </div>

          {/* Passo 2: Cidade */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1">
              <span>2. Cidade</span>
              <span className="text-red-500">*</span>
            </label>
            <select
              value={cidadeSelecionada}
              onChange={(e) => setCidadeSelecionada(e.target.value)}
              disabled={!estadoSelecionado || cidadesDisponiveis.length === 0}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-900 shadow-2xs transition-colors focus:border-sky-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 disabled:bg-zinc-100 disabled:text-zinc-400"
            >
              {cidadesDisponiveis.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Exibição dos Núcleos Encontrados */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
          <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
            <Building className="h-4 w-4 text-violet-600" />
            Núcleos em {cidadeSelecionada || "sua região"} ({estadoSelecionado})
          </h3>
          <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-bold text-violet-800">
            {nucleosFiltrados.length} núcleo{nucleosFiltrados.length !== 1 ? "s" : ""}
          </span>
        </div>

        {regioes.map((regiao) => (
          <div key={regiao} className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              {regiao}
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {porRegiao[regiao].map((n) => (
                <Link
                  key={n.id}
                  href={`/inscricao/nucleo/${n.id}`}
                  className="group flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:border-violet-300 hover:bg-violet-50/50 hover:shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="inline-block w-fit rounded-md bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-700">
                        Núcleo
                      </span>
                      <span className="font-semibold text-zinc-900 group-hover:text-violet-900">
                        {n.identificacao}
                      </span>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-zinc-300 transition-colors group-hover:text-violet-600 shrink-0" />
                  </div>

                  {n.nomeLocal && (
                    <span className="text-xs text-zinc-500">{n.nomeLocal}</span>
                  )}

                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
                    <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    <span>{[n.bairro, n.cidadeNome, n.estadoUf].filter(Boolean).join(" · ")}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {nucleosFiltrados.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 p-8 text-center">
            <Building className="mx-auto h-8 w-8 text-zinc-400" />
            <p className="mt-2 text-sm font-medium text-zinc-600">
              Nenhum núcleo encontrado para {cidadeSelecionada} - {estadoSelecionado}.
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Tente selecionar outro estado ou cidade acima.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
