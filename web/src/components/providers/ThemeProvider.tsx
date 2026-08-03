"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getTema, temas } from "@/lib/theme";
import { getAparencia, setAparencia } from "@/lib/mock/aparencia";
import type { TemaId } from "@/lib/theme";
import type { ConfigAparencia } from "@/lib/mock/aparencia";

interface ThemeContextValue {
  config: ConfigAparencia;
  aplicarTema: (id: TemaId) => void;
  setNomeSistema: (nome: string) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  config: { temaId: "andorinha", nomeSistema: "Andorinha" },
  aplicarTema: () => {},
  setNomeSistema: () => {},
});

function injetarCores(temaId: TemaId) {
  const tema = getTema(temaId);
  const root = document.documentElement;
  Object.entries(tema.cores).forEach(([shade, value]) => {
    root.style.setProperty(`--color-sky-${shade}`, value);
  });
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ConfigAparencia>(getAparencia);

  useEffect(() => {
    injetarCores(config.temaId);
  }, [config.temaId]);

  function aplicarTema(id: TemaId) {
    const next = setAparencia({ temaId: id });
    setConfig(next);
    injetarCores(id);
  }

  function setNomeSistema(nome: string) {
    const next = setAparencia({ nomeSistema: nome });
    setConfig(next);
  }

  return (
    <ThemeContext.Provider value={{ config, aplicarTema, setNomeSistema }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
