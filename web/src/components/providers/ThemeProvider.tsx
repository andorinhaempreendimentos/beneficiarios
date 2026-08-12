"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getTema, temas } from "@/lib/theme";
import { createClient } from "@/lib/supabase/client";
import type { TemaId } from "@/lib/theme";

export interface ConfigAparencia {
  temaId: TemaId;
  nomeSistema: string;
  logoUrl?: string;
}

interface ThemeContextValue {
  config: ConfigAparencia;
  modoEscuro: boolean;
  alternarModoEscuro: () => void;
  aplicarTema: (id: TemaId) => void;
  setNomeSistema: (nome: string) => void;
  setLogoUrl: (url: string | undefined) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  config: { temaId: "andorinha", nomeSistema: "Andorinha" },
  modoEscuro: false,
  alternarModoEscuro: () => {},
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
  const [config, setConfig] = useState<ConfigAparencia>({
    temaId: "andorinha",
    nomeSistema: "Andorinha Beneficiários",
  });
  const [modoEscuro, setModoEscuro] = useState(false);

  useEffect(() => {
    injetarCores(config.temaId);
  }, [config.temaId]);

  useEffect(() => {
    const salvo = localStorage.getItem("tema_modo");
    if (salvo === "dark" || (!salvo && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setModoEscuro(true);
      document.documentElement.classList.add("dark");
    } else {
      setModoEscuro(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  function alternarModoEscuro() {
    setModoEscuro((prev) => {
      const novo = !prev;
      if (novo) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("tema_modo", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("tema_modo", "light");
      }
      return novo;
    });
  }

  useEffect(() => {
    const sb = createClient();
    void Promise.resolve(sb.rpc("get_logo_url")).then(({ data }) => {
      if (data && typeof data === "string") {
        setConfig((prev: ConfigAparencia) => ({ ...prev, logoUrl: data }));
      }
    }).catch(() => {});
  }, []);

  function aplicarTema(id: TemaId) {
    setConfig((prev: ConfigAparencia) => ({ ...prev, temaId: id }));
    injetarCores(id);
  }

  function setNomeSistema(nome: string) {
    setConfig((prev: ConfigAparencia) => ({ ...prev, nomeSistema: nome }));
  }

  function setLogoUrl(url: string | undefined) {
    setConfig((prev: ConfigAparencia) => ({ ...prev, logoUrl: url }));
  }

  return (
    <ThemeContext.Provider value={{ config, modoEscuro, alternarModoEscuro, aplicarTema, setNomeSistema, setLogoUrl }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
