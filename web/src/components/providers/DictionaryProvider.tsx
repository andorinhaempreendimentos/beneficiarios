"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { configuracoesApi, objetosApi, type ObjetoApi } from "@/lib/api/services";
import { useLocationFilter } from "./LocationFilterProvider";
import { useAuth } from "./AuthProvider";

export interface Termo {
  conceito: string;
  labelAtual: string;
  padrao: string;
}

export interface TermosOverrideAtividade {
  termoGrupo?: string | null;
  termoSessao?: string | null;
  termoResponsavel?: string | null;
  termoParticipante?: string | null;
}

export const TERMOS_PADRAO: Record<string, Termo> = {
  local: { conceito: "local", labelAtual: "Núcleo", padrao: "Núcleo" },
  beneficiario: { conceito: "beneficiario", labelAtual: "Beneficiário", padrao: "Beneficiário" },
  objeto: { conceito: "objeto", labelAtual: "Objeto", padrao: "Objeto" },
  instrutor: { conceito: "instrutor", labelAtual: "Instrutor", padrao: "Instrutor" },
  turma: { conceito: "turma", labelAtual: "Turma", padrao: "Turma" },
  sessao: { conceito: "sessao", labelAtual: "Sessão", padrao: "Sessão" },
  atividade: { conceito: "atividade", labelAtual: "Atividade", padrao: "Atividade" },
  organizacao: { conceito: "organizacao", labelAtual: "Organização", padrao: "Organização" },
};

function pluralizar(palavra: string): string {
  if (!palavra) return palavra;
  const lower = palavra.toLowerCase();
  if (lower.endsWith("ão")) {
    return palavra.slice(0, -2) + (palavra.endsWith("ÃO") ? "ÕES" : "ões");
  }
  if (lower.endsWith("m")) {
    return palavra.slice(0, -1) + (palavra.endsWith("M") ? "NS" : "ns");
  }
  if (lower.endsWith("r") || lower.endsWith("z") || lower.endsWith("s")) {
    return palavra + (palavra === palavra.toUpperCase() ? "ES" : "es");
  }
  if (lower.endsWith("al") || lower.endsWith("el") || lower.endsWith("ol") || lower.endsWith("ul")) {
    return palavra.slice(0, -1) + (palavra.endsWith("L") ? "IS" : "is");
  }
  if (lower.endsWith("il")) {
    return palavra.slice(0, -1) + "s";
  }
  return palavra + (palavra === palavra.toUpperCase() ? "S" : "s");
}

interface DictionaryContextType {
  dicionario: Record<string, string>;
  termosList: Termo[];
  objetoAtivo: ObjetoApi | null;
  objetosDisponiveis: ObjetoApi[];
  setTermo: (conceito: string, novoValor: string) => void;
  restaurarTermo: (conceito: string) => void;
  salvarDicionario: () => Promise<void>;
  loading: boolean;
  salvando: boolean;
  t: (
    conceito: string,
    fallback?: string,
    plural?: boolean,
    overrideAtividade?: TermosOverrideAtividade | null
  ) => string;
}

const DictionaryContext = createContext<DictionaryContextType | undefined>(undefined);

const STORAGE_KEY = "andorinha_dicionario";

export function DictionaryProvider({ children }: { children: React.ReactNode }) {
  const { objetoId: locationObjetoId } = useLocationFilter();
  const { user } = useAuth();

  const [dicionario, setDicionario] = useState<Record<string, string>>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return Object.fromEntries(
      Object.values(TERMOS_PADRAO).map((t) => [t.conceito, t.labelAtual])
    );
  });

  const [objetosDisponiveis, setObjetosDisponiveis] = useState<ObjetoApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Carrega dicionário remoto e lista de objetos
  useEffect(() => {
    let cancelado = false;
    async function inicializar() {
      try {
        const [configRes, objetosRes] = await Promise.all([
          configuracoesApi.get("dicionario_termos").catch(() => null),
          objetosApi.list({ limit: 100 }).catch(() => ({ data: [] })),
        ]);

        if (cancelado) return;

        if (configRes && configRes.valor && typeof configRes.valor === "object") {
          const dictRemoto = configRes.valor as Record<string, string>;
          setDicionario((prev) => {
            const updated = { ...prev, ...dictRemoto };
            if (typeof window !== "undefined") {
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
              } catch {}
            }
            return updated;
          });
        }

        if (objetosRes?.data) {
          setObjetosDisponiveis(objetosRes.data);
        }
      } catch (err) {
        console.error("Erro ao carregar dados do dicionário:", err);
      } finally {
        if (!cancelado) setLoading(false);
      }
    }
    inicializar();
    return () => {
      cancelado = true;
    };
  }, []);

  // Objeto ativo: se o usuário estiver restrito a um objeto_id, usa ele; senão usa o selecionado no filtro
  const effectiveObjetoId = useMemo(() => {
    const userObjetoId = (user as any)?.objetoId;
    if (userObjetoId) return userObjetoId;
    if (locationObjetoId && locationObjetoId !== "Todos") return locationObjetoId;
    return null;
  }, [user, locationObjetoId]);

  const objetoAtivo = useMemo(() => {
    if (!effectiveObjetoId) return null;
    return objetosDisponiveis.find((o) => o.id === effectiveObjetoId) || null;
  }, [effectiveObjetoId, objetosDisponiveis]);

  const setTermo = useCallback((conceito: string, novoValor: string) => {
    setDicionario((prev) => {
      const next = { ...prev, [conceito]: novoValor };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  }, []);

  const restaurarTermo = useCallback((conceito: string) => {
    const padrao = TERMOS_PADRAO[conceito]?.padrao || conceito;
    setTermo(conceito, padrao);
  }, [setTermo]);

  const salvarDicionario = useCallback(async () => {
    setSalvando(true);
    try {
      await configuracoesApi.upsert("dicionario_termos", dicionario, "Dicionário de termos da aplicação");
    } catch (err) {
      console.error("Erro ao salvar dicionário no banco:", err);
      throw err;
    } finally {
      setSalvando(false);
    }
  }, [dicionario]);

  // Resolução Hierárquica em 3 Níveis:
  // 1. Nível Micro (Atividade): overrideAtividade (termoGrupo, termoSessao, termoResponsavel, termoParticipante)
  // 2. Nível Macro (Objeto Ativo): objetoAtivo (termoGrupo, termoSessao, termoResponsavel, termoParticipante)
  // 3. Nível Global (Sistema): dicionario[conceito] || fallback || TERMOS_PADRAO[conceito]?.padrao || conceito
  const t = useCallback(
    (
      conceito: string,
      fallback?: string,
      plural: boolean = false,
      overrideAtividade?: TermosOverrideAtividade | null
    ): string => {
      let label: string | undefined = undefined;
      const c = conceito.toLowerCase().trim();

      // 1. Termo de Grupo / Turma
      if (c === "turma" || c === "grupo") {
        label = overrideAtividade?.termoGrupo?.trim() ||
                objetoAtivo?.termoGrupo?.trim() ||
                dicionario["turma"] ||
                fallback ||
                "Turma";
      }
      // 2. Termo de Encontro / Sessão / Aula / Treino
      else if (c === "sessao" || c === "aula" || c === "treino" || c === "encontro") {
        label = overrideAtividade?.termoSessao?.trim() ||
                objetoAtivo?.termoSessao?.trim() ||
                dicionario["sessao"] ||
                fallback ||
                "Sessão";
      }
      // 3. Termo de Condutor / Instrutor / Professor / Responsável
      else if (c === "instrutor" || c === "professor" || c === "responsavel") {
        label = overrideAtividade?.termoResponsavel?.trim() ||
                objetoAtivo?.termoResponsavel?.trim() ||
                dicionario["instrutor"] ||
                fallback ||
                "Instrutor";
      }
      // 4. Termo de Praticante / Beneficiário / Aluno / Atleta / Participante
      else if (c === "beneficiario" || c === "participante" || c === "aluno" || c === "atleta") {
        label = overrideAtividade?.termoParticipante?.trim() ||
                objetoAtivo?.termoParticipante?.trim() ||
                dicionario["beneficiario"] ||
                fallback ||
                "Beneficiário";
      }
      // 5. Outros conceitos gerais (local/núcleo, objeto, organização, atividade)
      else {
        label = dicionario[c] || fallback || TERMOS_PADRAO[c]?.padrao || conceito;
      }

      if (plural) {
        return pluralizar(label);
      }

      return label;
    },
    [objetoAtivo, dicionario]
  );

  const termosList: Termo[] = useMemo(() => {
    return Object.keys(TERMOS_PADRAO).map((conceito) => ({
      conceito,
      labelAtual: dicionario[conceito] || TERMOS_PADRAO[conceito].padrao,
      padrao: TERMOS_PADRAO[conceito].padrao,
    }));
  }, [dicionario]);

  const contextValue = useMemo(
    () => ({
      dicionario,
      termosList,
      objetoAtivo,
      objetosDisponiveis,
      setTermo,
      restaurarTermo,
      salvarDicionario,
      loading,
      salvando,
      t,
    }),
    [dicionario, termosList, objetoAtivo, objetosDisponiveis, setTermo, restaurarTermo, salvarDicionario, loading, salvando, t]
  );

  return (
    <DictionaryContext.Provider value={contextValue}>
      {children}
    </DictionaryContext.Provider>
  );
}

export function useDicionario() {
  const context = useContext(DictionaryContext);
  if (!context) {
    throw new Error("useDicionario deve ser usado dentro de um DictionaryProvider");
  }
  return context;
}

export function useTermosAtividade(atividade?: TermosOverrideAtividade | null) {
  const { t } = useDicionario();
  return useMemo(
    () => ({
      grupo: (plural = false) => t("turma", undefined, plural, atividade),
      sessao: (plural = false) => t("sessao", undefined, plural, atividade),
      responsavel: (plural = false) => t("instrutor", undefined, plural, atividade),
      participante: (plural = false) => t("beneficiario", undefined, plural, atividade),
      t: (conceito: string, fallback?: string, plural = false) => t(conceito, fallback, plural, atividade),
    }),
    [t, atividade]
  );
}
