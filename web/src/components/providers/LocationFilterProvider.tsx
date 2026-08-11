"use client";

import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { Globe, MapPin, Filter, RotateCcw } from "lucide-react";

interface LocationFilterContextValue {
  estado: string; // "Todos" ou UF (ex: "TO")
  cidade: string; // "Todas" ou nome da cidade (ex: "Palmas")
  setEstado: (uf: string) => void;
  setCidade: (cidade: string) => void;
  limparFiltros: () => void;
}

const STORAGE_ESTADO_KEY = "andorinha_filtro_estado";
const STORAGE_CIDADE_KEY = "andorinha_filtro_cidade";

const LocationFilterContext = createContext<LocationFilterContextValue>({
  estado: "Todos",
  cidade: "Todas",
  setEstado: () => {},
  setCidade: () => {},
  limparFiltros: () => {},
});

export function LocationFilterProvider({ children }: { children: React.ReactNode }) {
  const [estado, setEstadoState] = useState<string>("Todos");
  const [cidade, setCidadeState] = useState<string>("Todas");

  useEffect(() => {
    try {
      const savedEstado = localStorage.getItem(STORAGE_ESTADO_KEY);
      const savedCidade = localStorage.getItem(STORAGE_CIDADE_KEY);
      if (savedEstado) setEstadoState(savedEstado);
      if (savedCidade) setCidadeState(savedCidade);
    } catch {
      // fallback
    }
  }, []);

  const setEstado = (uf: string) => {
    setEstadoState(uf);
    setCidadeState("Todas"); // Reseta a cidade ao trocar o estado
    try {
      localStorage.setItem(STORAGE_ESTADO_KEY, uf);
      localStorage.setItem(STORAGE_CIDADE_KEY, "Todas");
    } catch {
      // fallback
    }
  };

  const setCidade = (c: string) => {
    setCidadeState(c);
    try {
      localStorage.setItem(STORAGE_CIDADE_KEY, c);
    } catch {
      // fallback
    }
  };

  const limparFiltros = () => {
    setEstadoState("Todos");
    setCidadeState("Todas");
    try {
      localStorage.removeItem(STORAGE_ESTADO_KEY);
      localStorage.removeItem(STORAGE_CIDADE_KEY);
    } catch {
      // fallback
    }
  };

  const value = useMemo(
    () => ({ estado, cidade, setEstado, setCidade, limparFiltros }),
    [estado, cidade]
  );

  return (
    <LocationFilterContext.Provider value={value}>
      {children}
    </LocationFilterContext.Provider>
  );
}

export function useLocationFilter() {
  return useContext(LocationFilterContext);
}
