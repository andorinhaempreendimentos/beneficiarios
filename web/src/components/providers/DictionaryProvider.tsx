"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { configuracoesApi } from "@/lib/api/services";

export interface Termo {
  conceito: string;
  labelAtual: string;
  padrao: string;
}

export const TERMOS_PADRAO: Record<string, Termo> = {
  local: { conceito: "local", labelAtual: "Núcleo", padrao: "Núcleo" },
  beneficiario: { conceito: "beneficiario", labelAtual: "Beneficiário", padrao: "Beneficiário" },
  objeto: { conceito: "objeto", labelAtual: "Objeto", padrao: "Objeto" },
  instrutor: { conceito: "instrutor", labelAtual: "Instrutor", padrao: "Instrutor" },
  turma: { conceito: "turma", labelAtual: "Turma", padrao: "Turma" },
  atividade: { conceito: "atividade", labelAtual: "Atividade", padrao: "Atividade" },
  organizacao: { conceito: "organizacao", labelAtual: "Organização", padrao: "Organização" },
};

interface DictionaryContextType {
  dicionario: Record<string, string>;
  termosList: Termo[];
  setTermo: (conceito: string, novoValor: string) => void;
  restaurarTermo: (conceito: string) => void;
  salvarDicionario: () => Promise<void>;
  loading: boolean;
  salvando: boolean;
  t: (conceito: string, fallback?: string, plural?: boolean) => string;
}

const DictionaryContext = createContext<DictionaryContextType | undefined>(undefined);

const STORAGE_KEY = "andorinha_dicionario";

export function DictionaryProvider({ children }: { children: React.ReactNode }) {
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

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    async function carregarDicionario() {
      try {
        const config = await configuracoesApi.get("dicionario_termos");
        if (config && config.valor && typeof config.valor === "object") {
          const dictRemoto = config.valor as Record<string, string>;
          setDicionario((prev) => {
            const updated = { ...prev, ...dictRemoto };
            if (typeof window !== "undefined") {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            }
            return updated;
          });
        }
      } catch (err) {
        console.error("Erro ao carregar dicionário de termos:", err);
      } finally {
        setLoading(false);
      }
    }
    carregarDicionario();
  }, []);

  const setTermo = (conceito: string, novoValor: string) => {
    setDicionario((prev) => {
      const next = { ...prev, [conceito]: novoValor };
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  };

  const restaurarTermo = (conceito: string) => {
    const padrao = TERMOS_PADRAO[conceito]?.padrao || conceito;
    setTermo(conceito, padrao);
  };

  const salvarDicionario = async () => {
    setSalvando(true);
    try {
      await configuracoesApi.upsert("dicionario_termos", dicionario, "Dicionário de termos da aplicação");
    } catch (err) {
      console.error("Erro ao salvar dicionário no banco:", err);
      throw err;
    } finally {
      setSalvando(false);
    }
  };

  const t = (conceito: string, fallback?: string, plural: boolean = false): string => {
    let label = dicionario[conceito] || fallback || TERMOS_PADRAO[conceito]?.padrao || conceito;
    if (plural) {
      if (label.toLowerCase().endsWith("o")) {
        label = label + "s";
      } else if (label.toLowerCase().endsWith("r") || label.toLowerCase().endsWith("z")) {
        label = label + "es";
      } else if (label.toLowerCase().endsWith("l")) {
        label = label.slice(0, -1) + "is";
      } else {
        label = label + "s";
      }
    }
    return label;
  };

  const termosList: Termo[] = Object.keys(TERMOS_PADRAO).map((conceito) => ({
    conceito,
    labelAtual: dicionario[conceito] || TERMOS_PADRAO[conceito].padrao,
    padrao: TERMOS_PADRAO[conceito].padrao,
  }));

  return (
    <DictionaryContext.Provider
      value={{
        dicionario,
        termosList,
        setTermo,
        restaurarTermo,
        salvarDicionario,
        loading,
        salvando,
        t,
      }}
    >
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
