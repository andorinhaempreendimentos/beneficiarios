"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getTema, temas } from "@/lib/theme";
import { getAparencia, setAparencia } from "@/lib/mock/aparencia";
import { createClient } from "@/lib/supabase/client";
import type { TemaId } from "@/lib/theme";
import type { ConfigAparencia } from "@/lib/mock/aparencia";

interface ThemeContextValue {
  config: ConfigAparencia;
  aplicarTema: (id: TemaId) => void;
  setNomeSistema: (nome: string) => void;
  setLogoUrl: (url: string | undefined) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  config: { temaId: "andorinha", nomeSistema: "Andorinha" },
  aplicarTema: () => {},
  setNomeSistema: () => {},
  setLogoUrl: () => {},
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

  useEffect(() => {
    const sb = createClient();
    sb.rpc("get_logo_url").then(({ data }) => {
      if (data && typeof data === "string") {
        setConfig((prev) => ({ ...prev, logoUrl: data }));
      }
    }).catch(() => {});
  }, []);

  function aplicarTema(id: TemaId) {
    const next = setAparencia({ temaId: id });
    setConfig(next);
    injetarCores(id);
  }

  function setNomeSistema(nome: string) {
    const next = setAparencia({ nomeSistema: nome });
    setConfig(next);
  }

  function setLogoUrl(url: string | undefined) {
    setConfig((prev) => ({ ...prev, logoUrl: url }));
  }

  return (
    <ThemeContext.Provider value={{ config, aplicarTema, setNomeSistema, setLogoUrl }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
