"use client";

import { useState, useMemo } from "react";
import { MapPin, Globe, Building, CheckCircle2, Navigation } from "lucide-react";
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

  // Estado selecionado (inicia vazio para funcionar como pré-tela)
  const [estadoSelecionado, setEstadoSelecionado] = useState<string>("");

  // Cidades disponíveis no Estado selecionado
  const cidadesDisponiveis = useMemo(() => {
    if (!estadoSelecionado) return [];
    const cidades = Array.from(
      new Set(
        nucleosComEstado
          .filter((n) => n.estadoUf === estadoSelecionado)
          .map((n) => n.cidadeNome)
      )
    ).sort();
    return cidades;
  }, [nucleosComEstado, estadoSelecionado]);

  // Cidade selecionada (inicia vazia)
  const [cidadeSelecionada, setCidadeSelecionada] = useState<string>("");

  // Quando trocar o Estado, limpa a Cidade
  const handleSelecionarEstado = (uf: string) => {
    setEstadoSelecionado(uf);
    setCidadeSelecionada("");
  };

  // Núcleos filtrados pelo Estado e pela Cidade selecionados
  const nucleosFiltrados = useMemo(() => {
    if (!estadoSelecionado || !cidadeSelecionada) return [];
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

  const localizacaoDefinida = Boolean(estadoSelecionado && cidadeSelecionada);

  return (
    <div className="flex flex-col gap-6">
      {/* Box de Pré-tela: Seleção de Estado e Cidade */}
      <div className="rounded-2xl border border-sky-200 bg-linear-to-br from-sky-50/60 via-white to-white p-6 shadow-xs">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 text-white shadow-2xs">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-900">
              Selecione sua Localização
            </h2>
            <p className="text-xs text-zinc-500">
              Escolha seu Estado e Cidade para ver os núcleos de atendimento disponíveis.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Passo 1: Estado (UF) */}
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

          {/* Passo 2: Cidade */}
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
      </div>

      {/* Pré-tela: Mensagem Orientativa se ainda não selecionou a localização */}
      {!localizacaoDefinida && (
        <div className="rounded-2xl border border-dashed border-sky-300 bg-sky-50/30 p-10 text-center">
          <Navigation className="mx-auto h-10 w-10 text-sky-500" />
          <h3 className="mt-3 text-base font-bold text-zinc-900">
            Aguardando seleção de Estado e Cidade
          </h3>
          <p className="mt-1 text-sm text-zinc-500 max-w-md mx-auto">
            Por favor, selecione seu <strong>Estado</strong> e sua <strong>Cidade</strong> no painel acima para desbloquear e visualizar os núcleos disponíveis.
          </p>
        </div>
      )}

      {/* Exibição dos Núcleos Somente Após Seleção de Estado e Cidade */}
      {localizacaoDefinida && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
            <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <Building className="h-4 w-4 text-violet-600" />
              Núcleos em {cidadeSelecionada} - {estadoSelecionado}
            </h3>
            <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-bold text-violet-800">
              {nucleosFiltrados.length} núcleo{nucleosFiltrados.length !== 1 ? "s" : ""} encontrado{nucleosFiltrados.length !== 1 ? "s" : ""}
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
                Nenhum núcleo com inscrições abertas em {cidadeSelecionada} - {estadoSelecionado}.
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Tente selecionar outro estado ou cidade no painel acima.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
